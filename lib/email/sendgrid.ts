import { getSiteUrl } from "@/lib/site-url";

export type TransactionalEmail =
  | { kind: "verify"; to: string; name?: string | null; actionUrl: string }
  | { kind: "reset"; to: string; name?: string | null; actionUrl: string }
  | { kind: "welcome"; to: string; name?: string | null };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] ?? character);
}

function template(message: TransactionalEmail) {
  const siteUrl = getSiteUrl();
  const firstName = escapeHtml(message.name?.trim().split(/\s+/)[0] || "Guten Tag");
  const content = message.kind === "verify" ? {
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
  } : {
    subject: "Willkommen bei Rechtsfall-Check.de",
    preheader: "Ihr geschützter Fallraum ist jetzt aktiviert.",
    title: "Ihr Konto ist bereit.",
    text: "Sie können jetzt Ihren Rechtsfall schildern, Unterlagen sicher hochladen und den Rechtsfall Check starten.",
    button: "Zum persönlichen Fallraum",
    actionUrl: `${siteUrl}/fallraum`,
    note: "Die Registrierung ist kostenlos. Kosten entstehen erst, wenn Sie eine Fallprüfung ausdrücklich für 39 € beauftragen.",
  };
  const actionUrl = escapeHtml(content.actionUrl);
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${content.subject}</title></head><body style="margin:0;background:#eef3f8;color:#102433;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${content.preheader}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3f8"><tr><td align="center" style="padding:30px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="padding:25px 32px;background:#0b3049"><img src="${siteUrl}/rechtsfall-check-logo.png" width="250" alt="Rechtsfall-Check.de – Ein Fall für KI" style="display:block;max-width:100%;height:auto;background:#fff;border-radius:8px;padding:8px"></td></tr><tr><td style="padding:38px 32px"><p style="margin:0 0 12px;color:#2868ff;font-size:12px;font-weight:700;letter-spacing:1px">RECHTSFALL CHECK</p><h1 style="margin:0 0 18px;font-size:32px;line-height:1.15;color:#102433">${content.title}</h1><p style="margin:0 0 12px;font-size:17px;line-height:1.65">Hallo ${firstName},</p><p style="margin:0 0 28px;font-size:17px;line-height:1.65;color:#50616e">${content.text}</p><a href="${actionUrl}" style="display:inline-block;padding:15px 22px;border-radius:10px;background:#2868ff;color:#fff;text-decoration:none;font-size:16px;font-weight:700">${content.button}</a><p style="margin:28px 0 0;padding-top:22px;border-top:1px solid #e2e8ed;color:#71808a;font-size:13px;line-height:1.55">${content.note}</p></td></tr><tr><td style="padding:22px 32px;background:#f5f8fa;color:#71808a;font-size:12px;line-height:1.55">Media Online Innovations Group · Im Weidenblech 25 · 51371 Leverkusen<br><a href="${siteUrl}/datenschutz" style="color:#2868ff">Datenschutz</a> · <a href="${siteUrl}/impressum" style="color:#2868ff">Impressum</a></td></tr></table></td></tr></table></body></html>`;
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
