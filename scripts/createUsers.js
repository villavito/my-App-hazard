const path = require('path');
const { admin, auth, firestore } = require(path.join(__dirname, '..', 'backend', 'config', 'firebase.js'));
require('dotenv').config();

const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'ChangeMe123!';

const users = [
  { email: 'user@incident.com', displayName: 'Regular User', role: 'user' },
  { email: 'admin@incident.com', displayName: 'Admin User', role: 'admin' },
  { email: 'superadmin@incident.com', displayName: 'Super Admin', role: 'super_admin' },
];

async function ensureUser(u) {
  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(u.email);
      console.log(`Found existing user ${u.email} (uid=${userRecord.uid}), updating role...`);
      await auth.updateUser(userRecord.uid, { displayName: u.displayName });
    } catch (err) {
      if (err.code && err.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: u.email,
          emailVerified: false,
          password: DEFAULT_PASSWORD,
          displayName: u.displayName,
        });
        console.log(`Created user ${u.email} (uid=${userRecord.uid}) with default password.`);
      } else {
        throw err;
      }
    }

    // Set custom claims for role
    await auth.setCustomUserClaims(userRecord.uid, { role: u.role });

    // Ensure Firestore user doc
    const userDocRef = firestore.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      uid: userRecord.uid,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Ensured Firestore user doc for ${u.email} with role=${u.role}`);
  } catch (error) {
    console.error(`Error ensuring user ${u.email}:`, error);
  }
}

async function run() {
  if (!auth) {
    console.error('Firebase Admin Auth is not initialized. Check service account or environment.');
    process.exit(1);
  }

  for (const u of users) {
    // eslint-disable-next-line no-await-in-loop
    await ensureUser(u);
  }

  console.log('Done creating/updating users.');
  process.exit(0);
}

run();
