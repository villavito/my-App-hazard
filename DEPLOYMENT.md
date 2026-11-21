# Deployment

Everything runs on Firebase's free **Spark** plan. There is no server to host.

| Part | Where | How to update it |
|---|---|---|
| Web app | Firebase Hosting, https://incident-4a5a6.web.app | `npm run deploy:web` |
| Database rules and indexes | Firestore | `npm run deploy:rules` |
| Android app | Built on this PC | `npm run build:android` (see [ANDROID_RELEASE.md](ANDROID_RELEASE.md)) |

## What lives where

- **Sign-in**: Firebase Authentication (email/password and Google).
- **Reports**: Firestore, `incidents` collection.
- **Videos**: Firestore too, because Cloud Storage needs the paid Blaze plan. Each video is split into ~1 MB pieces under `incidentVideos/{incidentId}` (see `utils/videoStore.ts`). Videos are capped at **25 MB**. The app records 30 seconds at ~1 Mbps, about 4 MB.
- **Password reset**: Firebase's own reset email.
- **Agency emails**: optional, see below. Admins see every new report in their dashboard either way.

## Free-plan limits to keep in mind

| Limit | Spark plan | Roughly means |
|---|---|---|
| Firestore storage | 1 GB | ~250 videos at 4 MB |
| Firestore reads | 50,000 / day | Playing a 4 MB video costs about 6 reads |
| Firestore writes | 20,000 / day | Uploading a 4 MB video costs about 6 writes |
| Hosting downloads | 360 MB / day | ~400 new visitors a day |

Deleting a report also deletes its video and frees the space.

## 1. Web app

```
npm run deploy:web
```

This builds the site into `dist/` and uploads it. If the Firebase CLI says your login expired, run `npx firebase-tools login --reauth` first.

## 2. Database rules and indexes

Run this after any change to `firestore.rules` or `firestore.indexes.json`:

```
npm run test:rules     # checks the rules in a local emulator (needs Java)
npm run deploy:rules
```

The rules keep each agency's reports, and their videos, visible only to that agency's admins, super admins, and the person who reported them.

## 3. Agency emails (optional)

The live app has no server, so it sends agency emails through **EmailJS** (free, 200 emails a month, sent from your Gmail). Until it's set up, emails only go out during local development.

1. Sign up at https://www.emailjs.com.
2. **Email Services → Add New Service → Gmail.** Copy the **Service ID**.
3. **Email Templates → Create New Template.** Set **To Email** to `{{to_email}}`, the subject to `[HAZARD ALERT] New Incident Report - {{agency}}`, and use these fields in the body: `{{category}}`, `{{injury_level}}`, `{{location}}`, `{{coordinates}}`, `{{reported_by}}`, `{{status}}`, `{{incident_id}}`, `{{incident_link}}`. Copy the **Template ID**.
4. **Account → General**: copy the **Public Key**. On **Account → Security**, turn on *Allow EmailJS API for non-browser applications* (needed by the Android app).
5. Add to `.env.local`, then redeploy the web app and rebuild the Android app:
   ```
   EXPO_PUBLIC_EMAILJS_SERVICE_ID=...
   EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=...
   EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=...
   ```

## Local development

`npm start` runs the app and the dev server (`backend/server.js`). The dev server sends agency emails and SMS reset codes using `backend/.env`, and still serves videos of older reports saved in `backend/uploads`.
