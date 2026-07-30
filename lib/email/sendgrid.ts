import { getSiteUrl } from "@/lib/site-url";

export type TransactionalEmail =
  | { kind: "verify"; to: string; name?: string | null; actionUrl: string }
  | { kind: "reset"; to: string; name?: string | null; actionUrl: string }
  | { kind: "welcome"; to: string; name?: string | null }
  | { kind: "paymentConfirmed"; to: string; name?: string | null; caseTitle: string; actionUrl: string; receiptUrl?: string | null }
  | { kind: "questionsReady" | "reportReady"; to: string; name?: string | null; caseTitle: string; actionUrl: string }
  | { kind: "supportUpdate"; to: string; name?: string | null; ticketNumber: string; subject: string; actionUrl: string }
  | { kind: "supportNew"; to: string; name?: string | null; ticketNumber: string; subject: string; actionUrl: string }
  | {
      kind: "operationalAlert"; to: string; name?: string | null;
      alertCode: string; component: string; severity: "critical" | "high" | "warning";
      occurredAt: string; actionUrl: string;
    };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] ?? character);
}

function template(message: TransactionalEmail) {
  const siteUrl = getSiteUrl();
  const firstName = escapeHtml(message.name?.trim().split(/\s+/)[0] || "Guten Tag");
  const content = message.kind === "supportUpdate" ? {
    subject: `Neue Antwort zu ${message.ticketNumber}`,
    preheader: "Im Support-Center liegt eine neue Nachricht vor.",
    title: "Der Support hat geantwortet.",
    text: `Zu Ihrem Ticket „${escapeHtml(message.subject)}“ liegt eine neue Nachricht im geschützten Support-Center vor.`,
    button: "Support-Ticket öffnen",
    actionUrl: message.actionUrl,
    note: "Aus Datenschutzgründen enthält diese E-Mail keine Ticket- oder Fallinhalte. Antworten Sie bitte direkt im geschützten Nutzerkonto.",
  } : message.kind === "supportNew" ? {
    subject: `Neues Support-Ticket ${message.ticketNumber}`,
    preheader: "Ein neues Support-Anliegen wurde eröffnet.",
    title: "Ein neues Support-Ticket liegt vor.",
    text: `Das Ticket ${escapeHtml(message.ticketNumber)} mit dem Betreff „${escapeHtml(message.subject)}“ wurde eröffnet.`,
    button: "Ticket im Betrieb öffnen",
    actionUrl: message.actionUrl,
    note: "Die Benachrichtigung enthält bewusst keine Fall- oder Nachrichteninhalte. Bitte bearbeiten Sie das Anliegen ausschließlich im geschützten Support-Center.",
  } : message.kind === "paymentConfirmed" ? {
    subject: `Zahlungsbestätigung: ${message.caseTitle}`,
    preheader: "Ihr Rechtsfall-Check wurde freigeschaltet.",
    title: "Ihre Zahlung ist bestätigt.",
    text: `Die Zahlung über 19,00 € für „${escapeHtml(message.caseTitle)}“ ist eingegangen. Ihr Rechtsfall-Check ist jetzt freigeschaltet.`,
    button: "Fallakte öffnen",
    actionUrl: message.actionUrl,
    note: message.receiptUrl
      ? `Den von Stripe bereitgestellten Zahlungsbeleg können Sie hier abrufen: ${escapeHtml(message.receiptUrl)}`
      : "Den Zahlungsstatus finden Sie jederzeit in Ihrer geschützten Fallakte.",
  } : message.kind === "operationalAlert" ? {
    subject: `[${message.severity.toUpperCase()}] Systemalarm: ${message.alertCode}`,
    preheader: `Technischer Alarm in ${message.component}.`,
    title: "Technischer Systemalarm.",
    text: `Im Bereich ${escapeHtml(message.component)} wurde das Ereignis ${escapeHtml(message.alertCode)} erkannt. Zeitpunkt: ${escapeHtml(message.occurredAt)}. Die Alarmmeldung enthält aus Datenschutzgründen keine Fallinhalte oder Dokumentdaten.`,
    button: "Systemprotokoll öffnen",
    actionUrl: message.actionUrl,
    note: "Bitte prüfen Sie das Betreiber-Dashboard und die Protokolle des betroffenen Dienstes. Antworten Sie nicht mit Zugangsdaten oder Falldokumenten auf diese E-Mail.",
  } : message.kind === "verify" ? {
    subject: "Bitte bestätigen Sie Ihre E-Mail-Adresse",
    preheader: "Aktivieren Sie jetzt Ihr Konto bei Rechtsfall-Check.de.",
    title: "Nur noch ein Schritt.",
    text: "Bestätigen Sie Ihre E-Mail-Adresse, damit Ihr persönlicher und geschützter Fallraum aktiviert wird.",
    button: "E-Mail-Adresse bestätigen",
    actionUrl: message.actionUrl,
    note: "Dieser Bestätigungslink ist 60 Minuten gültig. Wenn Sie kein Konto angelegt haben, können Sie diese E-Mail ignorieren.",
  } : message.kind === "reset" ? {
    subject: "Neues Passwort für Ihr Konto",
    preheader: "Vergeben Sie ein neues Passwort für Rechtsfall-Check.de.",
    title: "Passwort sicher zurücksetzen.",
    text: "Über die folgende Schaltfläche können Sie ein neues Passwort für Ihr Nutzerkonto vergeben.",
    button: "Neues Passwort vergeben",
    actionUrl: message.actionUrl,
    note: "Dieser Link ist 60 Minuten gültig. Wenn Sie die Änderung nicht angefordert haben, bleibt Ihr bisheriges Passwort bestehen.",
  } : message.kind === "questionsReady" ? {
    subject: `Rückfragen zu Ihrem Rechtsfall-Check: ${message.caseTitle}`,
    preheader: "Die erste Analyse ist abgeschlossen. Bitte ergänzen Sie noch einige Angaben.",
    title: "Die erste Analyse ist abgeschlossen.",
    text: `Zu „${escapeHtml(message.caseTitle)}“ liegen jetzt gezielte Rückfragen vor. Beantworten Sie diese Schritt für Schritt, damit wir Ihren Rechtsfall-Check vertiefen können.`,
    button: "Rückfragen beantworten",
    actionUrl: message.actionUrl,
    note: "Ihre Antworten werden einzeln gespeichert. Erst danach wird die vertiefte, nicht abschließende Ersteinschätzung erstellt.",
  } : message.kind === "reportReady" ? {
    subject: `Ihr Prüfbericht ist bereit: ${message.caseTitle}`,
    preheader: "Ihr persönlicher Rechtsfall-Check kann jetzt abgerufen werden.",
    title: "Ihr Prüfbericht ist bereit.",
    text: `Die vertiefte Prüfung zu „${escapeHtml(message.caseTitle)}“ ist abgeschlossen. Ihr persönlicher Prüfbericht steht im geschützten Fallraum bereit.`,
    button: "Prüfbericht öffnen",
    actionUrl: message.actionUrl,
    note: "Der Bericht ist eine KI-gestützte, nicht abschließende Ersteinschätzung und ersetzt keine anwaltliche Rechtsberatung.",
  } : {
    subject: "Willkommen bei Rechtsfall-Check.de",
    preheader: "Ihr geschützter Fallraum ist jetzt aktiviert.",
    title: "Ihr Konto ist bereit.",
    text: "Sie können jetzt Ihren Rechtsfall schildern, Unterlagen sicher hochladen und den Rechtsfall Check starten.",
    button: "Zum persönlichen Fallraum",
    actionUrl: `${siteUrl}/fallraum`,
    note: "Die Registrierung ist kostenlos. Kosten entstehen erst, wenn Sie einen Rechtsfall Check ausdrücklich für 19 € beauftragen.",
  };
  const actionUrl = escapeHtml(content.actionUrl);
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${content.subject}</title></head><body style="margin:0;padding:0;background:#eef3f8;color:#102433;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${content.preheader}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#eef3f8" style="width:100%;background:#eef3f8"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #dfe8ef"><tr><td height="6" bgcolor="#2868ff" style="height:6px;background:#2868ff;font-size:0;line-height:0">&nbsp;</td></tr><tr><td bgcolor="#ffffff" style="padding:24px 32px;background:#ffffff;border-bottom:1px solid #e5edf3"><a href="${siteUrl}" style="text-decoration:none"><img src="${siteUrl}/rechtsfall-check-logo.png" width="275" alt="Rechtsfall-Check.de – Ein Fall für KI" style="display:block;width:275px;max-width:100%;height:auto;border:0"></a></td></tr><tr><td bgcolor="#ffffff" style="padding:38px 32px;background:#ffffff"><p style="margin:0 0 12px;color:#2868ff;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:1px">RECHTSFALL CHECK</p><h1 style="margin:0 0 18px;font-size:32px;line-height:1.15;color:#102433;font-weight:700">${content.title}</h1><p style="margin:0 0 12px;font-size:17px;line-height:1.65;color:#102433">Hallo ${firstName},</p><p style="margin:0 0 28px;font-size:17px;line-height:1.65;color:#50616e">${content.text}</p><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#2868ff" style="background:#2868ff;border-radius:8px;text-align:center"><a href="${actionUrl}" style="display:block;padding:15px 22px;border:1px solid #2868ff;border-radius:8px;color:#ffffff;text-decoration:none;font-size:16px;line-height:1.2;font-weight:700">${content.button}</a></td></tr></table><p style="margin:28px 0 0;padding-top:22px;border-top:1px solid #e2e8ed;color:#71808a;font-size:13px;line-height:1.55">${content.note}</p></td></tr><tr><td bgcolor="#f5f8fa" style="padding:22px 32px;background:#f5f8fa;color:#71808a;font-size:12px;line-height:1.65;border-top:1px solid #e5edf3">Rechtsfall-Check.de ist ein Angebot der Media Online Innovations Group<br>Im Weidenblech 25 · 51371 Leverkusen<br><a href="${siteUrl}/datenschutz" style="color:#2868ff;text-decoration:underline">Datenschutz</a> · <a href="${siteUrl}/impressum" style="color:#2868ff;text-decoration:underline">Impressum</a></td></tr></table></td></tr></table></body></html>`;
  const text = `${content.title}\n\nHallo ${message.name?.trim().split(/\s+/)[0] || "Guten Tag"},\n\n${content.text}\n\n${content.button}:\n${content.actionUrl}\n\n${content.note}\n\nMedia Online Innovations Group\nIm Weidenblech 25\n51371 Leverkusen`;
  return { subject: content.subject, html, text };
}

export async function sendTransactionalEmail(message: TransactionalEmail) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    if (process.env.NODE_ENV === "production") throw new Error("SendGrid is not configured.");
    return { skipped: true };
  }
  const mail = template(message);
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: message.to }], subject: mail.subject }],
      from: { email: fromEmail, name: process.env.SENDGRID_FROM_NAME || "Rechtsfall-Check.de" },
      reply_to: process.env.SENDGRID_REPLY_TO ? { email: process.env.SENDGRID_REPLY_TO } : undefined,
      content: [{ type: "text/plain", value: mail.text }, { type: "text/html", value: mail.html }],
      categories: [`rechtsfall-check-${message.kind}`],
    }),
  });
  if (!response.ok) throw new Error(`SendGrid delivery failed: ${response.status}`);
  return { skipped: false };
}
