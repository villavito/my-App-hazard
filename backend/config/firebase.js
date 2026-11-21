const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
// backend/.env by path (see backend/server.js), then a root .env fallback.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

// Where the Firebase Console's "Generate new private key" file goes by default
// (gitignored; scripts/deployRules.js looks here too).
const DEFAULT_KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  serviceAccount = null;
} else if (fs.existsSync(DEFAULT_KEY_PATH)) {
  serviceAccount = require(DEFAULT_KEY_PATH);
} else {
  console.warn(
    `Firebase Admin credentials not found. Save the service account key as ${DEFAULT_KEY_PATH} ` +
      '(Firebase Console > Project settings > Service accounts > Generate new private key).',
  );
}

if (serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} else {
  admin.initializeApp();
}

const firestore = admin.firestore();
let auth = null;
try {
  auth = admin.auth();
} catch {
  auth = null;
}

module.exports = { admin, firestore, auth };
