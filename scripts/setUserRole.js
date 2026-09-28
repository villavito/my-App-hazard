/**
 * Fix a single user's role after the fact - e.g. an account that got created
 * as "user" because it was registered before the signup screen's email-suffix
 * rule matched it (see app/signup.tsx).
 *
 * Sets both the Firestore users/{uid}.role field and the matching Firebase
 * Auth custom claim, so it takes effect whether the app reads one or the
 * other.
 *
 * Usage:
 *   node scripts/setUserRole.js <email> <user|admin|super_admin> [agency]
 *
 * Needs Firebase Admin credentials, same as scripts/createUsers.js:
 *   FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT_PATH, or
 *   GOOGLE_APPLICATION_CREDENTIALS.
 */
const path = require('path');
const { admin, auth, firestore } = require(path.join(__dirname, '..', 'backend', 'config', 'firebase.js'));
require('dotenv').config();

const VALID_ROLES = ['user', 'admin', 'super_admin'];

async function run() {
  const [, , email, role, agency] = process.argv;

  if (!email || !role) {
    console.error('Usage: node scripts/setUserRole.js <email> <user|admin|super_admin> [agency]');
    process.exit(1);
  }
  if (!VALID_ROLES.includes(role)) {
    console.error(`Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }
  if (!auth) {
    console.error('Firebase Admin Auth is not initialized. Check service account or environment.');
    process.exit(1);
  }

  const userRecord = await auth.getUserByEmail(email);
  console.log(`Found ${email} (uid=${userRecord.uid}), current claims:`, userRecord.customClaims || {});

  await auth.setCustomUserClaims(userRecord.uid, { role, ...(agency ? { agency } : {}) });

  // Only admins are scoped to an agency - clear it for any other role (same as
  // updateUserRole in services/firestoreService.ts), so a stale agency can't
  // silently come back if the account is later promoted to admin again.
  await firestore.collection('users').doc(userRecord.uid).set(
    {
      role,
      ...(role !== 'admin'
        ? { agency: admin.firestore.FieldValue.delete() }
        : agency
          ? { agency }
          : {}),
    },
    { merge: true },
  );

  // Show the agency on the citizens' report screen right away, rather than
  // only after this admin's next sign-in (see setAgencyActive in authService).
  if (role === 'admin' && agency) {
    await firestore.collection('agencies').doc(agency).set(
      { active: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );
  }

  console.log(`Updated ${email} (uid=${userRecord.uid}) to role=${role}${agency ? ` agency=${agency}` : ''}.`);
  console.log('Sign the user out and back in so the app picks up the new role.');
  process.exit(0);
}

run().catch((error) => {
  console.error('Failed to update role:', error);
  process.exit(1);
});
