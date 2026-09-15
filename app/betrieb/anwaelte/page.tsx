import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { lawyerLegalAreas, lawyerProfiles, lawyerSubscriptions, users } from "@/db/schema";
import { MemberNavigation } from "@/app/components/member-navigation";
import { MemberFooter } from "@/app/components/member-footer";
import { requireAdmin } from "@/lib/server/admin";
import { legalAreas } from "@/lib/legal-areas";
import { LawyerReviewForm } from "./lawyer-review-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Anwaltsprüfung | Betrieb", robots: { index: false, follow: false } };
const formatDate = (value: Date | null) => value ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(value) : "–";

export default async function LawyerOperationsPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const db = getDb();
  const [profiles, areaRows, subscriptions] = await Promise.all([
    db.select({ profile: lawyerProfiles, email: users.email, firstName: users.firstName, lastName: users.lastName })
      .from(lawyerProfiles).innerJoin(users, eq(users.id, lawyerProfiles.userId)).orderBy(desc(lawyerProfiles.updatedAt)),
    db.select().from(lawyerLegalAreas),
    db.select().from(lawyerSubscriptions).orderBy(desc(lawyerSubscriptions.createdAt)),
  ]);
  return <div className="member-shell"><MemberNavigation userName={admin.displayName} userEmail={admin.email} adminMode/>
    <main className="operations-page"><header className="member-heading"><span>BETREIBER-DASHBOARD</span><h1>Anwälte prüfen und freigeben</h1><p>Profile bleiben bis zur dokumentierten Prüfung und bestätigten Jahreszahlung für Nutzer unsichtbar.</p></header>
      <section className="operations-panel lawyer-review-list"><header><div><span>ANWALTSPROFILE</span><h2>Zulassung, Kanzleisitz und Vertragsstatus</h2></div><strong>{profiles.length}</strong></header>
        {profiles.length === 0 ? <p>Noch keine Kanzleiprofile eingereicht.</p> : profiles.map(({ profile, email, firstName, lastName }) => {
          const areas = areaRows.filter(row => row.lawyerId === profile.userId).map(row => legalAreas.find(area => area.id === row.legalArea)?.title || row.legalArea);
          const subscription = subscriptions.find(row => row.lawyerId === profile.userId);
          return <article className="lawyer-review-card" key={profile.userId}>
            <div className="lawyer-review-summary"><div><small>{profile.status}</small><h3>{profile.firmName}</h3><p>{[firstName, lastName].filter(Boolean).join(" ")} · {email}</p></div><div><strong>{profile.barAssociation}</strong><p>{profile.street}, {profile.postalCode} {profile.city}</p><p>Radius: {profile.practiceRadiusKm} km · Vertrag: {subscription?.status || "Noch nicht gebucht"}</p></div></div>
            <div className="lawyer-review-meta"><span>{areas.join(" · ")}</span><span>Eingereicht/aktualisiert: {formatDate(profile.updatedAt)}</span>{profile.officialDirectoryUrl && <a href={profile.officialDirectoryUrl} target="_blank" rel="noreferrer">Amtlichen Eintrag öffnen ↗</a>}</div>
            <LawyerReviewForm lawyerId={profile.userId} initialNote={profile.verificationNote || ""} initialLatitude={profile.latitudeE6 == null ? null : profile.latitudeE6 / 1_000_000} initialLongitude={profile.longitudeE6 == null ? null : profile.longitudeE6 / 1_000_000}/>
          </article>;
        })}
      </section>
    </main><MemberFooter/>
    <style>{`.lawyer-review-list{display:grid;gap:18px}.lawyer-review-card{padding:24px;border:1px solid #d7e2ea;border-radius:16px;background:#fff}.lawyer-review-summary{display:grid;grid-template-columns:1fr 1fr;gap:22px}.lawyer-review-summary h3{margin:4px 0;font-size:22px}.lawyer-review-summary p,.lawyer-review-meta{color:#607482}.lawyer-review-summary small{font-weight:850;color:#397dcc}.lawyer-review-meta{display:flex;flex-wrap:wrap;gap:12px;margin:15px 0;padding:13px 0;border-top:1px solid #e2e9ee;border-bottom:1px solid #e2e9ee;font-size:12px}.lawyer-review-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}.lawyer-review-form label{display:grid;gap:6px;font-size:12px;font-weight:750}.lawyer-review-form input,.lawyer-review-form textarea{padding:11px;border:1px solid #cbd8e1;border-radius:9px;font:inherit}.lawyer-review-form .full{grid-column:1/-1}.lawyer-review-actions{display:flex;gap:10px}.lawyer-review-actions button{padding:11px 14px;border:0;border-radius:9px;background:#0b3048;color:#fff;font-weight:750}.lawyer-review-actions button+button{background:#e8eef3;color:#17384e}@media(max-width:700px){.lawyer-review-summary,.lawyer-review-form{grid-template-columns:1fr}}`}</style>
  </div>;
}
