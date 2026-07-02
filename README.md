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

Add `VITE_ADMIN_SETUP_KEY` to lock first-admin creation. The first admin setup form will require this key before it writes the first user to Firestore.

For initial testing, enable **Authentication > Sign-in method > Anonymous** and create **Firestore Database**. Example development rules:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Tighten these rules before production deployment.
