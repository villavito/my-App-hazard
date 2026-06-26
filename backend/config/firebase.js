const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  serviceAccount = null;
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  admin.initializeApp();
}

const firestore = admin.firestore();
let auth = null;
let storage = null;
try {
  auth = admin.auth();
} catch (e) {
  auth = null;
}
try {
  storage = admin.storage ? admin.storage() : null;
} catch (e) {
  storage = null;
}

module.exports = { admin, firestore, auth, storage };
