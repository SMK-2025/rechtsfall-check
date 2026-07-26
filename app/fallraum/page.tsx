import type { Metadata } from "next";
import { MemberDashboard } from "../member-dashboard";
import { getChatGPTUser, chatGPTSignInPath } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Geschützter Fallraum | Rechtsfall KI",
  description: "Strukturieren Sie Ihren Testfall im geschützten Fallraum von Rechtsfall KI.",
  robots: { index: false, follow: false },
};

export default async function CaseRoom() {
  const user = await getChatGPTUser();
  if (!user) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <a className="brand" href="/"><span className="brand-mark">R</span>Rechtsfall KI</a>
          <h1>Ihr geschützter Fallraum.</h1>
          <p>Zum Schutz Ihrer vertraulichen Angaben müssen Sie sich anmelden.</p>
          <a className="primary auth-link" href={chatGPTSignInPath("/fallraum")}>Sicher anmelden</a>
          <small>Die Identität wird serverseitig geprüft. Ohne Anmeldung ist kein Fallzugriff möglich.</small>
          <a className="back-link" href="/">← Zur öffentlichen Homepage</a>
        </div>
      </main>
    );
  }
  return <MemberDashboard userName={user.displayName} />;
}
