/**
 * Delete a user entirely - both the Firebase Auth account and its Firestore
 * users/{uid} doc - so a fresh signup with the same email starts clean.
 *
 * Usage:
 *   node scripts/deleteUser.js <email>
 *
 * Needs Firebase Admin credentials, same as scripts/createUsers.js:
 *   FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT_PATH, or
 *   GOOGLE_APPLICATION_CREDENTIALS.
 */
const path = require('path');
const { auth, firestore } = require(path.join(__dirname, '..', 'backend', 'config', 'firebase.js'));
require('dotenv').config();

async function run() {
  const [, , email] = process.argv;

  if (!email) {
    console.error('Usage: node scripts/deleteUser.js <email>');
    process.exit(1);
  }
  if (!auth) {
    console.error('Firebase Admin Auth is not initialized. Check service account or environment.');
    process.exit(1);
  }

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`No Auth user found for ${email} - nothing to delete there.`);
    } else {
      throw error;
    }
  }

  if (userRecord) {
    await auth.deleteUser(userRecord.uid);
    console.log(`Deleted Auth user ${email} (uid=${userRecord.uid}).`);

    const docRef = firestore.collection('users').doc(userRecord.uid);
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.delete();
      console.log(`Deleted Firestore users/${userRecord.uid} doc.`);
    } else {
      console.log(`No Firestore users/${userRecord.uid} doc found.`);
    }
  }

  console.log('Done. You can sign up with this email again.');
  process.exit(0);
}

run().catch((error) => {
  console.error('Failed to delete user:', error);
  process.exit(1);
});
