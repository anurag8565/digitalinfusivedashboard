# Digital Infusive Dashboard

React + Vite dashboard ready for Netlify deployment.

## Local setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Netlify settings:

- Build command: `npm run build`
- Publish directory: `dist`

## Firebase

Copy `.env.example` to `.env` and fill the Firebase web app config values.
On Netlify, add the same values in **Site configuration > Environment variables**.

The app uses Firebase Anonymous Auth and Cloud Firestore. If Firebase env vars are not configured, it falls back to browser localStorage.
