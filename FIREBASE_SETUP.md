# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter your project name (e.g., "hazard-app")
4. Follow the setup steps

## 2. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" sign-in method
4. Save your settings

## 3. Setup Firestore Database

1. Go to "Firestore Database" in Firebase Console
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location
5. Click "Create"

## 4. Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Under "Your apps", click the web icon (`</>`)
3. Copy the Firebase configuration object
4. Update `config/firebase.ts` with your configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 5. Install Firebase Dependencies

Run these commands in your project directory:

```bash
npm install firebase
npm install @types/firebase --save-dev
```

## 6. Uncomment Firebase Code

Once Firebase is configured, uncomment the Firebase imports and code in:

- `app/(auth)/login.tsx` (line 4, 22-23)
- `app/signup.tsx` (line 4, 34-43)
- `components/LogoutButton.tsx` (line 4, 15-16)

## 7. Firebase Rules

For Firestore, create these rules in Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 8. Test Your Setup

1. Run your app
2. Try signing up with a new account
3. Check Firebase Console to see the new user
4. Test login and logout functionality

## Notes

- The current code has Firebase integration commented out for easy setup
- All authentication flows are ready to work once Firebase is configured
- User data will be stored in Firestore under the "users" collection
- Error handling and loading states are already implemented
