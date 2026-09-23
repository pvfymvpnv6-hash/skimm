# CLAUDE.md

Diese Datei gibt Claude (und anderen Code-Agenten) Kontext für die Arbeit an diesem Repo.

## Projekt

Skimm ist eine News-App mit Artikelkarten (Titel, Bild, Teaser). Ursprünglich in Google AI
Studio gebaut und von dort exportiert.

## Stack

- **Frontend:** React 19 + Vite 6 + Tailwind CSS 4, TypeScript. Einstiegspunkt `src/main.tsx`,
  App-Root `src/App.tsx`.
- **API-Logik:** Framework-neutrale Routentabelle in `apiRoutes.ts` (RSS-Parsing via
  `rss-parser`, Gemini-Anfragen via `@google/genai`, OG-Image-Scraping, Wetter/Verkehr/Aktien-
  Endpunkte). Diese Tabelle wird von zwei Stellen konsumiert:
  - `server.ts` (Express) für die lokale Entwicklung (`npm run dev`).
  - `api/index.ts` als Vercel Serverless Function für Produktion. Kein dynamisches
    `[...slug].ts`-Catch-all (das hat auf Vercel 2+-Segment-Pfade wie `/api/news/expand`
    nicht erreicht - Plattform-Routing-Bug, siehe PR #7); stattdessen eine `rewrites`-Regel
    in `vercel.json`, die `/api/:path*` als `?slug=:path*` an die statische `/api`-Route
    übergibt.
- **Package Manager:** `bun.lock` liegt im Repo (aus dem AI-Studio-Export); Vercel erkennt
  daran automatisch Bun für den Install-Schritt. Der Build selbst läuft über den in
  `vercel.json` gesetzten `buildCommand` (`npm run build:web`), unabhängig vom Install-Tool.
- **Firebase (optional, nur Markt-Favoriten):** Eigenes Firebase-Projekt (nicht dasselbe wie
  Vane/Aura), Config in `firebase-applet-config.json` (öffentlich, kein Secret - wie bei den
  anderen beiden Apps). `src/lib/firebase.ts` bietet Google-Login + Firestore-Sync für die 5
  Markt-Favoriten im `StockTicker`-Widget. Kein Login-Zwang: ohne Konto bleibt alles wie
  bisher rein lokal in `localStorage`; mit Google-Login werden die Favoriten zusätzlich unter
  `users/{userId}.marketFavorites` in Firestore gespiegelt (geräteübergreifend). Beim ersten
  Login werden vorhandene lokale Favoriten einmalig hochgeladen, danach ist die Cloud die
  Quelle der Wahrheit (Live-Subscribe). `firestore.rules`: nur der eigene User darf sein
  Dokument lesen/schreiben.

## Deployment

- **Produktion läuft auf Vercel.** Build-Konfiguration in `vercel.json`
  (`buildCommand: npm run build:web`, `outputDirectory: dist`, `framework: vite`).
- Die `/api/*`-Endpunkte laufen als eine einzelne Vercel Serverless Function (`api/index.ts`),
  kein dauerhafter Express-Prozess. Sie delegiert an die Handler aus `apiRoutes.ts`.
- **Netlify wurde abgeschaltet** und ist nicht mehr Teil des Deployments. Es sollen keine
  Netlify-spezifischen Dateien (`netlify.toml`, `netlify/`) wieder eingeführt werden.
- `server.ts` bleibt für lokale Entwicklung (`npm run dev`, Vite Middleware + Express) sowie
  als Fallback für eine mögliche Node/Cloud-Run-Ausführung erhalten, wird aber auf Vercel
  nicht verwendet.

## Umgebungsvariablen

Nur die Namen, niemals Werte ins Repo committen (siehe `.env.example` als Vorlage,
`.env*` ist in `.gitignore`):

- `GEMINI_API_KEY` – für die Gemini-Endpunkte (`/api/news/briefing`, `/api/news/summarize`,
  `/api/news/expand`). Ohne Key liefern diese Endpunkte eingebaute Fallback-Antworten statt
  einen Fehler.
- `APP_URL` – URL, unter der die App deployed ist (Selbstreferenz).

Auf Vercel werden diese unter Project Settings -> Environment Variables gesetzt.

## Arbeitsregeln für Code-Agenten in diesem Repo

- Erst kurz den Plan nennen, dann in kleinen, nachvollziehbaren Schritten arbeiten.
- Nach Änderungen den Build testen (`npm run build:web`, `npm run lint` für `tsc --noEmit`).
- Keine neuen Abhängigkeiten ohne Rückfrage hinzufügen.
- Nicht direkt auf `main` pushen, sondern in einem eigenen Branch arbeiten und PRs stellen.
- Änderungen kurz auf Deutsch erklären.
- Keine Secrets/Env-Werte ins Repo schreiben, nur Variablennamen dokumentieren.
