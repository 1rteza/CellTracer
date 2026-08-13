# CellTracer

**Track how your phone's battery is really aging — logged by you, analyzed automatically, synced across every device you own.**

CellTracer is a personal battery-health tracker built as a single self-contained web app. There's no companion app to install and no root access required — you log a battery percentage reading now and then, and it turns that into an estimated health score, an mAh capacity estimate, and trend charts, the same way phone manufacturers frame their own "battery health" number.

Try it live: **[your deployed URL here]** — or tap **"Try it with demo devices"** on first sign-in to see it fully populated without logging anything yourself.

---

## Why this exists

No third-party app on an unrooted phone can read a battery's true remaining capacity — that number lives behind hardware-level APIs no app gets access to. CellTracer doesn't pretend otherwise. Instead, it infers wear from a heuristic: how fast the battery drains now, compared to earlier, weighted toward the readings that are least affected by how you happened to be using the phone that day (idle/overnight sessions are the cleanest signal — heavy gaming sessions are the noisiest).

It's built to be honest about that limitation everywhere it shows a number, not just in a footnote.

## Features

- **Google sign-in**, with your data synced across every device via MongoDB
- **Manual battery logging** — percentage, optional screen-on-time, temperature, and usage type (idle / light / heavy, auto-detected if you skip it)
- **Health score & estimated capacity**, weighted toward your most reliable (idle) sessions once you have enough of them
- **Edit and swipe-to-delete** on any past log entry
- **Multi-device comparison** — see health side-by-side across every phone you track
- **Period summaries** (Today / Yesterday / Last 7 days / Last 30 days / All time) with per-session breakdowns
- **JSON backup/restore**, downloadable and re-importable at any time
- **Demo mode** — two realistic pre-populated devices for anyone trying the app cold, clearly marked and deletable anytime
- Fully responsive: bottom tab navigation on mobile, top nav on desktop

## Tech stack

- **Frontend:** Plain React 18 (no build step, no bundler) + hand-rolled SVG charts, loaded via CDN and transpiled in-browser with Babel Standalone
- **Auth:** Firebase Authentication (Google provider)
- **Database:** MongoDB Atlas, one document per user
- **Backend:** A single serverless function (Vercel or Netlify, both supported) that verifies the caller's Firebase ID token before reading/writing that user's MongoDB document
- **Hosting:** Vercel (or Netlify) — zero build step for the frontend, since it's a static file

This is intentionally a no-framework, no-bundler project — the entire frontend is one HTML file.

## Running your own copy

1. Create a **Firebase** project, enable Google sign-in, and grab your web config.
2. Create a **MongoDB Atlas** free cluster and a database user.
3. Deploy this repo to Vercel (or Netlify) and set two environment variables:
   - `MONGODB_URI` — your Atlas connection string
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — a service account key from Firebase (Project Settings → Service Accounts → Generate new private key), pasted as raw JSON
4. Add your deployed domain to Firebase's **Authorized domains** list (Authentication → Settings).
5. Paste your Firebase web config into the `firebaseConfig` object near the top of `index.html`.

No `npm run build` — the backend function's two dependencies (`mongodb`, `firebase-admin`) are the only thing that gets installed.

## Honest limitations

- The health score reflects change **since you started logging**, not lifetime wear from the day you bought the phone — it can't see degradation that happened before your first entry.
- It's a statistical estimate from self-reported data, not a manufacturer measurement. Treat it as a trend indicator, not a diagnostic fact.
- Accuracy improves with more logging, especially idle/overnight readings — the app tells you exactly how many you have and how many you need.

## License

Personal project, shared as-is. Feel free to fork and adapt for your own use.
