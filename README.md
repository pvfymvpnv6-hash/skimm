<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0f030955-e29e-4a0a-96e5-0c005964a17c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy on Netlify

The `/api/*` endpoints run as a Netlify Function (`netlify/functions/api.ts`), which serves the route table from `apiRoutes.ts`. The same table is used by `server.ts` locally. `netlify.toml` sets the build (`vite build` -> `dist`).

Set `GEMINI_API_KEY` under Site configuration -> Environment variables (needed for the AI briefing/summary/expand endpoints; without it they return their built-in fallbacks).
