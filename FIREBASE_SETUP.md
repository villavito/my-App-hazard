# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter your project name (e.g., "hazard-app")
4. Follow the setup steps

## 2. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" and "Google" sign-in methods
4. Save your settings

For Google sign-in, create OAuth client IDs in the Google Cloud project linked
to Firebase:

- Android: use package name `com.villavito.incidentreportingapp` and add the
  app's signing certificate SHA-1 fingerprints.
- iOS: use bundle ID `com.villavito.incidentreportingapp`.
- Web: add the app's web origin to Firebase Authentication's authorized
  domains, and add the browser origin and AuthSession redirect URL to the web
  OAuth client's authorized origins and redirect URIs.

Put the resulting client IDs in the project-root `.env.local` file:

```dotenv
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
```

These are public OAuth client IDs, not client secrets. Restart Expo after
changing them. Native Google sign-in requires a development or production
build configured with the matching package/bundle ID and signing credentials.
Expo Go cannot complete this OAuth redirect; use `npx expo run:android` or
`npx expo run:ios` to build and install a development app instead. For Android,
register the development build's SHA-1 signing fingerprint with its Android
OAuth client in Firebase/Google Cloud before testing.

## 3. Setup Firestore Database

1. Go to "Firestore Database" in Firebase Console
2. Click "Create database"
3. Choose "Start in production mode" (the real rules are deployed from this repo in step 7)
4. Select a location
5. Click "Create"

## 4. Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Under "Your apps", click the web icon (`</>`)
3. Copy the Firebase configuration object into `firebaseConfig` in `config/firebase.ts`

`config/firebase.ts` already initializes Auth (AsyncStorage persistence on
native, browser persistence on web) and Firestore - no other code changes are
needed.

## 5. Install Dependencies

```bash
npm install
```

## 6. Backend Credentials (Firebase Admin)

The backend (`backend/server.js`) and the admin scripts in `scripts/` use the
Firebase Admin SDK. Download a service account key from Project Settings →
Service accounts, then provide it one of these ways (in `.env` or `backend/.env`):

- `FIREBASE_SERVICE_ACCOUNT_PATH` - path to the key JSON
- `FIREBASE_SERVICE_ACCOUNT_BASE64` - the key JSON, base64-encoded
- `GOOGLE_APPLICATION_CREDENTIALS` - standard Google credentials path

Saving the key as `backend/config/serviceAccountKey.json` also lets
`npm run deploy:rules` run without a browser login. Key files are gitignored -
never commit them.

Optional backend settings: `PORT`, `APP_URL`, and `SMTP_HOST` / `SMTP_PORT` /
`SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` for email.

## 7. Firestore Rules

The rules live in `firestore.rules` (user roles and agency isolation). Don't
paste rules into the console - test and deploy them from the repo:

```bash
npm run test:rules     # runs scripts/testRules.js against the Firestore emulator
npm run deploy:rules   # deploys firestore.rules and firestore.indexes.json
```

## 8. Seed and Manage Users

```bash
npm run create-users                                                # seed default user/admin/super_admin accounts
npm run set-user-role -- <email> <user|admin|super_admin> [agency]  # change a user's role
npm run delete-user -- <email>                                      # remove a user
```

`create-users` uses `DEFAULT_USER_PASSWORD` (default `ChangeMe123!`) - change
it before creating real accounts.

## 9. Run the App

```bash
npm start   # starts the backend and Expo together
```

Then sign up with a new account, check it appears in Firebase Console, and
test login/logout and incident reporting.
