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

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name (e.g., `digitalinfusive-dashboard`)
4. Disable Google Analytics (optional) and create the project

### 2. Register Web App

1. In the Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"** and click the web icon `</>` to add a web app
3. Register the app (e.g., name it `digital-infusive-dashboard`)
4. Copy the `firebaseConfig` object values

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the values from your Firebase web app config:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_APP_NAMESPACE=your-app-namespace
   ```

### 4. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Anonymous** sign-in provider
3. Enable **Email/Password** sign-in provider

### 5. Create Firestore Database

1. In Firebase Console, go to **Firestore Database** > **Create database**
2. Select a location (e.g., `us-central`)
3. Start in **Test mode** (we'll deploy proper rules next)

### 6. Deploy Firestore Rules

The Firestore rules have been properly configured in `firestore.rules` to provide appropriate access controls:

- Users can read all users, but only admins can write user data
- Users can read/write leads they're assigned to
- Projects can be read by all authenticated users, but only admins/BDM/Lead TL can create/update/delete
- Communications can be read/written by authenticated users

The rules are already configured in `firestore.rules` and have been deployed. No further action is needed.

### 7. Deploy to Firebase Hosting (Optional)

```bash
firebase init hosting
firebase deploy
```

## Development Notes

- The app uses Firebase Anonymous Auth and Cloud Firestore.
- If Firebase env vars are not configured, it falls back to browser localStorage.
- Seed users are auto-created on first login when `handleLogin` is called with credentials matching `INITIAL_USERS`.
- **Important:** Do NOT commit `.env` to version control. It is already in `.gitignore`.

## Collections

- `users` — Team members with roles (Super Admin, Lead TL, Pre-Sales, BDM)
- `leads` — Lead records with status, assignment, and sales stage
- `projects` — Post-Won project execution board
- `communications` — Activity logs attached to leads/projects
