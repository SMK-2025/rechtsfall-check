# GitHub → Vercel

## 1. Projekt verbinden

In Vercel **Add New → Project** wählen, `SMK-2025/rechtsfall-ki` importieren und Framework `Next.js` bestätigen. Build Command und Output Directory nicht überschreiben. Produktionsbranch ist `main`.

## 2. Infrastruktur verbinden

1. Über den Vercel Marketplace eine Neon-PostgreSQL-Datenbank möglichst in Frankfurt anlegen und `DATABASE_URL` für Production, Preview und Development bereitstellen.
2. Unter Storage einen **privaten** Vercel Blob Store anlegen und mit dem Projekt verbinden. Vercel setzt `BLOB_READ_WRITE_TOKEN`.
3. In GitHub eine OAuth App anlegen:
   - Homepage URL: endgültige Produktions-URL
   - Callback URL: `https://DEINE-DOMAIN/api/auth/callback/github`
4. Diese Variablen in Vercel setzen:
   - `NEXT_PUBLIC_SITE_URL=https://DEINE-DOMAIN`
   - `BETTER_AUTH_URL=https://DEINE-DOMAIN`
   - `BETTER_AUTH_SECRET` (mindestens 32 zufällige Bytes)
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL=gpt-5.6-terra`

In Stripe einen Webhook auf `https://DEINE-DOMAIN/api/webhooks/stripe` mit dem Ereignis `checkout.session.completed` anlegen. Der Signing Secret wird als `STRIPE_WEBHOOK_SECRET` gespeichert.

Secrets niemals in GitHub committen.

## 3. Datenbank einmalig migrieren

Nach dem Verbinden lokal:

```bash
vercel link
vercel env pull .env.local
pnpm db:migrate
```

Migrationen zuerst gegen Preview/Staging prüfen. Schemaänderungen werden als Drizzle-Migration committed und kontrolliert vor dem zugehörigen Produktionscode ausgeführt.

## 4. Automatischer Ablauf

- Push auf einen Feature-Branch → Vercel Preview Deployment
- Pull Request → eigene prüfbare Preview URL
- Merge/Push auf `main` → automatisches Production Deployment
- Fehlgeschlagener Build → bisherige Production-Version bleibt aktiv

Vor einem öffentlichen Pilot müssen die in README und Sicherheitsdokument genannten Freigaben abgeschlossen sein.
