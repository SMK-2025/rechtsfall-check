"use client";

import { FormEvent, useState } from "react";
import { MemberFooter } from "@/app/components/member-footer";
import { MemberNavigation } from "@/app/components/member-navigation";
import { authClient } from "@/lib/auth-client";
import { TwoFactorSettings } from "./two-factor-settings";

type Profile = {
  firstName: string;
  lastName: string;
  street: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  twoFactorEnabled: boolean;
  deletionRequestedAt: string | null;
  deletionScheduledFor: string | null;
};
type Notice = { type: "success" | "error"; text: string } | null;

function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return <div className={`profile-notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.text}</div>;
}

export function ProfileForm({ initial, required = false, returnTo = "/fallraum" }: { initial: Profile; required?: boolean; returnTo?: string }) {
  const [profile, setProfile] = useState(initial);
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailNotice, setEmailNotice] = useState<Notice>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirmation: "" });
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [deletionScheduledFor, setDeletionScheduledFor] = useState(initial.deletionScheduledFor);
  const [deletionMode, setDeletionMode] = useState<"scheduled" | "immediate">("scheduled");
  const [deletionConfirmation, setDeletionConfirmation] = useState("");
  const [deletionAcknowledged, setDeletionAcknowledged] = useState(false);
  const [deletionNotice, setDeletionNotice] = useState<Notice>(null);
  const [deletionBusy, setDeletionBusy] = useState(false);
  const [consentNotice, setConsentNotice] = useState<Notice>(null);
  const [consentBusy, setConsentBusy] = useState(false);
  const update = (key: keyof Profile, value: string) => setProfile(current => ({ ...current, [key]: value }));

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setProfileBusy(true);
    setProfileNotice(null);
    try {
      const response = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profile),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Die Angaben konnten nicht gespeichert werden.");
      const { error } = await authClient.updateUser({ name: `${profile.firstName.trim()} ${profile.lastName.trim()}` });
      if (error) throw new Error("Die Angaben wurden gespeichert, der Anzeigename konnte jedoch nicht aktualisiert werden.");
      setProfileNotice({ type: "success", text: "Ihre persönlichen Angaben wurden gespeichert." });
      if (required) window.location.href = returnTo;
    } catch (error) {
      setProfileNotice({ type: "error", text: error instanceof Error ? error.message : "Die Angaben konnten nicht gespeichert werden." });
    } finally {
      setProfileBusy(false);
    }
  }

  async function changeEmail(event: FormEvent) {
    event.preventDefault();
    setEmailNotice(null);
    if (!newEmail.trim() || newEmail.trim().toLowerCase() === profile.email.toLowerCase()) {
      setEmailNotice({ type: "error", text: "Bitte geben Sie eine andere, gültige E-Mail-Adresse ein." });
      return;
    }
    setEmailBusy(true);
    const { error } = await authClient.changeEmail({ newEmail: newEmail.trim(), callbackURL: "/profil" });
    setEmailBusy(false);
    if (error) {
      setEmailNotice({ type: "error", text: error.message || "Die E-Mail-Adresse konnte nicht geändert werden." });
      return;
    }
    setNewEmail("");
    setEmailNotice({ type: "success", text: "Wir haben einen Bestätigungslink an die neue E-Mail-Adresse gesendet. Die Änderung wird erst nach der Bestätigung wirksam." });
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordNotice(null);
    if (passwords.next.length < 10) {
      setPasswordNotice({ type: "error", text: "Das neue Passwort muss mindestens 10 Zeichen lang sein." });
      return;
    }
    if (passwords.next !== passwords.confirmation) {
      setPasswordNotice({ type: "error", text: "Die neuen Passwörter stimmen nicht überein." });
      return;
    }
    setPasswordBusy(true);
    const { error } = await authClient.changePassword({
      currentPassword: passwords.current,
      newPassword: passwords.next,
      revokeOtherSessions: true,
    });
    setPasswordBusy(false);
    if (error) {
      setPasswordNotice({ type: "error", text: error.message || "Das Passwort konnte nicht geändert werden. Prüfen Sie Ihr bisheriges Passwort." });
      return;
    }
    setPasswords({ current: "", next: "", confirmation: "" });
    setPasswordNotice({ type: "success", text: "Ihr Passwort wurde geändert. Andere aktive Sitzungen wurden aus Sicherheitsgründen beendet." });
  }

  async function requestDeletion(event: FormEvent) {
    event.preventDefault();
    setDeletionNotice(null);
    if (!deletionAcknowledged || deletionConfirmation !== "LÖSCHEN") {
      setDeletionNotice({ type: "error", text: "Bitte bestätigen Sie die Folgen und geben Sie LÖSCHEN vollständig ein." });
      return;
    }
    setDeletionBusy(true);
    try {
      const response = await fetch("/api/v1/privacy/account", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: deletionMode, confirmation: deletionConfirmation, acknowledged: deletionAcknowledged }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Die Kontolöschung konnte nicht beauftragt werden.");
      if (result.deleted) {
        await authClient.signOut().catch(() => undefined);
        window.location.href = "/?konto=gelöscht";
        return;
      }
      setDeletionScheduledFor(result.scheduledFor);
      setDeletionConfirmation("");
      setDeletionAcknowledged(false);
      setDeletionNotice({ type: "success", text: "Die Löschung ist vorgemerkt. Sie können sie bis zum angezeigten Termin widerrufen." });
    } catch (error) {
      setDeletionNotice({ type: "error", text: error instanceof Error ? error.message : "Die Kontolöschung konnte nicht beauftragt werden." });
    } finally {
      setDeletionBusy(false);
    }
  }

  async function cancelDeletion() {
    setDeletionBusy(true);
    setDeletionNotice(null);
    try {
      const response = await fetch("/api/v1/privacy/account", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Die Löschung konnte nicht widerrufen werden.");
      setDeletionScheduledFor(null);
      setDeletionNotice({ type: "success", text: "Die vorgemerkte Kontolöschung wurde widerrufen. Ihr Konto bleibt bestehen." });
    } catch (error) {
      setDeletionNotice({ type: "error", text: error instanceof Error ? error.message : "Die Löschung konnte nicht widerrufen werden." });
    } finally {
      setDeletionBusy(false);
    }
  }

  async function withdrawAiConsent() {
    if (!window.confirm("Möchten Sie Ihre KI-Einwilligung für alle Fallakten mit Wirkung für die Zukunft widerrufen? Ohne eine neue ausdrückliche Einwilligung können keine weiteren KI-Analysen durchgeführt werden.")) return;
    setConsentBusy(true);
    setConsentNotice(null);
    try {
      const response = await fetch("/api/v1/privacy/consent", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Die Einwilligung konnte nicht widerrufen werden.");
      setConsentNotice({
        type: "success",
        text: result.affectedCaseCount
          ? `Ihre Einwilligung wurde für ${result.affectedCaseCount} Fallakte${result.affectedCaseCount === 1 ? "" : "n"} mit Wirkung für die Zukunft widerrufen.`
          : "Es lag keine aktive KI-Einwilligung zum Widerruf vor.",
      });
    } catch (error) {
      setConsentNotice({ type: "error", text: error instanceof Error ? error.message : "Die Einwilligung konnte nicht widerrufen werden." });
    } finally {
      setConsentBusy(false);
    }
  }

  return <div className="member-shell">
    <MemberNavigation userName={`${profile.firstName} ${profile.lastName}`.trim()} userEmail={profile.email}/>
    <main className="member-main profile-main">
      <div className="member-heading"><div><span className="section-label">MEIN KONTO</span><h1>Persönliche Angaben</h1><p>Verwalten Sie Ihre Kontakt-, Adress- und Zugangsdaten.</p></div></div>
      {required && <div className="profile-required-notice" role="status"><strong>Bitte vervollständigen Sie zuerst Ihr Profil.</strong><span>Danach können Sie Ihren Rechtsfall Check und alle weiteren Kontofunktionen nutzen.</span></div>}

      <form id="persoenliche-daten" className="app-card profile-card" onSubmit={saveProfile}>
        <div className="profile-card-head"><div className="profile-card-icon" aria-hidden="true">01</div><div><h2>Persönliche Daten</h2><p>Diese Angaben werden Ihrem Nutzerkonto und Ihren Fallakten zugeordnet.</p></div></div>
        <div className="app-grid profile-grid">
          <div className="field"><label htmlFor="firstName">Vorname</label><input id="firstName" autoComplete="given-name" value={profile.firstName} onChange={event => update("firstName", event.target.value)} required maxLength={80}/></div>
          <div className="field"><label htmlFor="lastName">Nachname</label><input id="lastName" autoComplete="family-name" value={profile.lastName} onChange={event => update("lastName", event.target.value)} required maxLength={80}/></div>
          <div className="field full"><label htmlFor="street">Straße und Hausnummer</label><input id="street" autoComplete="street-address" value={profile.street} onChange={event => update("street", event.target.value)} required maxLength={160}/></div>
          <div className="field"><label htmlFor="postalCode">Postleitzahl</label><input id="postalCode" autoComplete="postal-code" inputMode="numeric" value={profile.postalCode} onChange={event => update("postalCode", event.target.value)} required maxLength={12}/></div>
          <div className="field"><label htmlFor="city">Ort</label><input id="city" autoComplete="address-level2" value={profile.city} onChange={event => update("city", event.target.value)} required maxLength={100}/></div>
          <div className="field"><label htmlFor="phone">Telefonnummer</label><input id="phone" type="tel" autoComplete="tel" value={profile.phone} onChange={event => update("phone", event.target.value)} required maxLength={40}/></div>
          <div className="field"><label htmlFor="accountEmail">E-Mail-Adresse</label><input id="accountEmail" type="email" value={profile.email} readOnly aria-describedby="email-change-hint"/><small className="field-help" id="email-change-hint">Änderungen nehmen Sie unten im Bereich Kontosicherheit vor.</small></div>
        </div>
        <NoticeBox notice={profileNotice}/>
        <div className="app-actions"><small>Ihre Angaben werden verschlüsselt übertragen und nur für Ihr Konto und Ihre Fallbearbeitung verwendet.</small><button className="button" disabled={profileBusy}>{profileBusy ? "Wird gespeichert …" : "Änderungen speichern"}</button></div>
      </form>

      <section id="zugangsdaten" className="profile-security" aria-labelledby="security-title">
        <div className="profile-section-title"><span className="section-label">KONTOSICHERHEIT</span><h2 id="security-title">Zugangsdaten verwalten</h2><p>E-Mail-Adresse und Passwort werden getrennt von Ihren persönlichen Angaben geändert.</p></div>
        <div className="profile-security-grid">
          <form className="app-card profile-card security-card" onSubmit={changeEmail}>
            <div className="profile-card-head"><div className="profile-card-icon" aria-hidden="true">02</div><div><h2>E-Mail-Adresse ändern</h2><p>Ihre derzeitige Login-Adresse lautet <strong>{profile.email}</strong>.</p></div></div>
            <div className="field"><label htmlFor="newEmail">Neue E-Mail-Adresse</label><input id="newEmail" type="email" autoComplete="email" value={newEmail} onChange={event => setNewEmail(event.target.value)} required placeholder="neue-adresse@beispiel.de"/></div>
            <NoticeBox notice={emailNotice}/>
            <p className="security-hint">Die neue Adresse wird erst aktiv, nachdem Sie den Link in der Bestätigungs-E-Mail geöffnet haben.</p>
            <button className="button button-full" disabled={emailBusy}>{emailBusy ? "Wird vorbereitet …" : "E-Mail-Adresse ändern"}</button>
          </form>

          <form className="app-card profile-card security-card" onSubmit={changePassword}>
            <div className="profile-card-head"><div className="profile-card-icon" aria-hidden="true">03</div><div><h2>Passwort ändern</h2><p>Wählen Sie ein neues Passwort mit mindestens 10 Zeichen.</p></div></div>
            <div className="field"><label htmlFor="currentPassword">Aktuelles Passwort</label><input id="currentPassword" type="password" autoComplete="current-password" value={passwords.current} onChange={event => setPasswords(current => ({ ...current, current: event.target.value }))} required maxLength={128}/></div>
            <div className="field"><label htmlFor="newPassword">Neues Passwort</label><input id="newPassword" type="password" autoComplete="new-password" value={passwords.next} onChange={event => setPasswords(current => ({ ...current, next: event.target.value }))} required minLength={10} maxLength={128}/></div>
            <div className="field"><label htmlFor="confirmPassword">Neues Passwort wiederholen</label><input id="confirmPassword" type="password" autoComplete="new-password" value={passwords.confirmation} onChange={event => setPasswords(current => ({ ...current, confirmation: event.target.value }))} required minLength={10} maxLength={128}/></div>
            <NoticeBox notice={passwordNotice}/>
            <p className="security-hint">Nach der Änderung werden alle anderen angemeldeten Geräte automatisch ausgeloggt.</p>
            <button className="button button-full" disabled={passwordBusy}>{passwordBusy ? "Wird gespeichert …" : "Passwort ändern"}</button>
          </form>
        </div>
        <TwoFactorSettings initialEnabled={initial.twoFactorEnabled}/>
      </section>
      <section id="datenschutz" className="profile-security" aria-labelledby="privacy-tools-title">
        <div className="profile-section-title"><span className="section-label">DATENSCHUTZ</span><h2 id="privacy-tools-title">Ihre Daten im Blick</h2><p>Laden Sie die zu Ihrem Konto gespeicherten strukturierten Daten in einem maschinenlesbaren Format herunter.</p></div>
        <div className="app-card profile-card">
          <div className="profile-card-head"><div className="profile-card-icon" aria-hidden="true">04</div><div><h2>Datenexport</h2><p>Der Export enthält Profil, Fallaufnahmen, Fragen, Antworten, Prüfergebnisse und Protokollinformationen. Hochgeladene Originaldateien sind aus Sicherheitsgründen nicht im JSON-Paket enthalten.</p></div></div>
          <div className="app-actions"><small>Der Download wird nur in Ihrer angemeldeten Sitzung erzeugt und nicht zwischengespeichert.</small><a className="button" href="/api/v1/privacy/export" download>Meine Daten herunterladen</a></div>
        </div>
        <div className="app-card profile-card">
          <div className="profile-card-head"><div className="profile-card-icon" aria-hidden="true">05</div><div><h2>KI-Einwilligung widerrufen</h2><p>Beendet die einwilligungsbasierte KI-Verarbeitung Ihrer Fallakten mit Wirkung für die Zukunft.</p></div></div>
          <p>Bereits erstellte Rechtsfall-Checks bleiben in Ihrem Konto gespeichert. Für eine weitere Analyse müssen Sie in der betreffenden Fallakte erneut ausdrücklich einwilligen.</p>
          <NoticeBox notice={consentNotice}/>
          <div className="app-actions"><small>Der Widerruf wird mit Zeitpunkt protokolliert und verändert weder abgeschlossene Ergebnisse noch gesetzlich erforderliche Nachweise.</small><button className="button secondary" type="button" disabled={consentBusy} onClick={withdrawAiConsent}>{consentBusy ? "Widerruf wird gespeichert …" : "KI-Einwilligung widerrufen"}</button></div>
        </div>
        <div id="konto-loeschen" className="app-card profile-card account-deletion-card">
          <div className="profile-card-head"><div className="profile-card-icon danger" aria-hidden="true">06</div><div><h2>Konto löschen</h2><p>Entfernt Ihr Nutzerkonto und sämtliche zugeordneten Rechtsfall-Checks unwiderruflich.</p></div></div>
          {deletionScheduledFor ? <>
            <div className="deletion-status" role="status">
              <strong>Ihr Konto ist zur Löschung vorgemerkt.</strong>
              <p>Die endgültige Löschung erfolgt am <b>{new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeStyle: "short" }).format(new Date(deletionScheduledFor))}</b>. Bis dahin bleibt das Konto aktiv und Sie können die Löschung widerrufen.</p>
            </div>
            <NoticeBox notice={deletionNotice}/>
            <button className="button secondary" type="button" disabled={deletionBusy} onClick={cancelDeletion}>{deletionBusy ? "Wird widerrufen …" : "Kontolöschung widerrufen"}</button>
          </> : <form className="account-deletion-form" onSubmit={requestDeletion}>
            <div className="deletion-warning">
              <strong>Was dauerhaft gelöscht wird</strong>
              <ul><li>Ihre persönlichen Daten und Zugangsdaten</li><li>Alle Fallbeschreibungen, Antworten und Rückfragen</li><li>Alle hochgeladenen Dokumente aus dem Dateispeicher</li><li>Alle KI-Analysen, Ergebnisse und Prüfberichte</li><li>Alle Sitzungen und internen Kontoverknüpfungen</li></ul>
              <p>Die Daten können nach der endgültigen Löschung nicht wiederhergestellt werden. Zahlungsinformationen, die ausschließlich bei Stripe aufgrund gesetzlicher Pflichten gespeichert werden, unterliegen den dort geltenden Aufbewahrungsfristen.</p>
            </div>
            <fieldset className="deletion-options">
              <legend>Wann soll gelöscht werden?</legend>
              <label><input type="radio" name="deletionMode" value="scheduled" checked={deletionMode === "scheduled"} onChange={() => setDeletionMode("scheduled")}/><span><strong>Mit 30 Tagen Widerrufsfrist</strong><small>Das Konto bleibt 30 Tage aktiv. In dieser Zeit können Sie die Löschung jederzeit widerrufen.</small></span></label>
              <label><input type="radio" name="deletionMode" value="immediate" checked={deletionMode === "immediate"} onChange={() => setDeletionMode("immediate")}/><span><strong>Sofort und ohne Widerrufsfrist löschen</strong><small>Sie verzichten ausdrücklich auf die 30-tägige Widerrufsmöglichkeit. Die Löschung beginnt sofort.</small></span></label>
            </fieldset>
            <label className="deletion-consent"><input type="checkbox" checked={deletionAcknowledged} onChange={event => setDeletionAcknowledged(event.target.checked)}/><span>Ich habe verstanden, dass mein Konto, alle Nutzerdaten, Angaben, Dokumente und Rechtsfall-Checks unwiderruflich gelöscht werden. {deletionMode === "immediate" && <strong>Ich verzichte ausdrücklich auf die 30-tägige Widerrufsfrist.</strong>}</span></label>
            <div className="field"><label htmlFor="deletionConfirmation">Zur Bestätigung „LÖSCHEN“ eingeben</label><input id="deletionConfirmation" value={deletionConfirmation} onChange={event => setDeletionConfirmation(event.target.value)} autoComplete="off" placeholder="LÖSCHEN"/></div>
            <NoticeBox notice={deletionNotice}/>
            <button className="button danger-button" disabled={deletionBusy || !deletionAcknowledged || deletionConfirmation !== "LÖSCHEN"}>{deletionBusy ? "Löschung wird verarbeitet …" : deletionMode === "immediate" ? "Konto jetzt unwiderruflich löschen" : "Kontolöschung vormerken"}</button>
          </form>}
        </div>
      </section>
    </main>
    <MemberFooter />
  </div>;
}
