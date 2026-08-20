/**
 * Security-rules tests for agency isolation.
 *
 * These prove the property the app depends on: an agency admin can only ever
 * touch its own agency's incidents. The app already filters by agency in its
 * queries, but that is a UI convention - these tests cover the case where
 * someone talks to Firestore directly and bypasses the app entirely.
 *
 * Run against the emulator (no credentials, no live data touched):
 *   npm run test:rules
 *
 * Plain Node rather than a test runner, so the project needs no jest config.
 */

const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const fs = require("fs");
const path = require("path");
const { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, where } =
  require("firebase/firestore");

const results = [];

async function check(name, promise) {
  try {
    await promise;
    results.push({ name, passed: true });
    console.log(`  PASS  ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${error.message.split("\n")[0]}`);
  }
}

async function run() {
  const testEnv = await initializeTestEnvironment({
    projectId: "rules-test-agency-isolation",
    firestore: {
      rules: fs.readFileSync(
        path.join(__dirname, "..", "firestore.rules"),
        "utf8",
      ),
      host: "127.0.0.1",
      port: 8080,
    },
  });

  await testEnv.clearFirestore();

  // Seed with rules bypassed - this is fixture setup, not something under test.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    await setDoc(doc(db, "users", "pnp-admin"), {
      uid: "pnp-admin",
      email: "pnp@admin.com",
      displayName: "PNP Admin",
      role: "admin",
      agency: "PNP",
    });
    await setDoc(doc(db, "users", "bfp-admin"), {
      uid: "bfp-admin",
      email: "bfp@admin.com",
      displayName: "BFP Admin",
      role: "admin",
      agency: "BFP",
    });
    // An admin whose user doc never got an `agency` field - the exact state that
    // used to fail open and show every agency's reports.
    await setDoc(doc(db, "users", "noagency-admin"), {
      uid: "noagency-admin",
      email: "admin@admin.com",
      displayName: "Agencyless Admin",
      role: "admin",
    });
    await setDoc(doc(db, "users", "super"), {
      uid: "super",
      email: "super@super_admin.com",
      displayName: "Super Admin",
      role: "super_admin",
    });
    await setDoc(doc(db, "users", "reporter"), {
      uid: "reporter",
      email: "reporter@example.com",
      displayName: "Reporter",
      role: "user",
    });

    await setDoc(doc(db, "incidents", "pnp-incident"), {
      id: "pnp-incident",
      userId: "reporter",
      userEmail: "reporter@example.com",
      videoUrl: "file:///pnp.mp4",
      injuryLevel: "No Injury",
      involvedAgency: "PNP",
      location: "Zamboanga",
      status: "pending",
      createdAt: new Date(),
    });
    await setDoc(doc(db, "incidents", "bfp-incident"), {
      id: "bfp-incident",
      userId: "reporter",
      userEmail: "reporter@example.com",
      videoUrl: "file:///bfp.mp4",
      injuryLevel: "Minor (First Aid)",
      involvedAgency: "BFP",
      location: "Ayala",
      status: "pending",
      createdAt: new Date(),
    });
  });

  const pnp = testEnv.authenticatedContext("pnp-admin").firestore();
  const bfp = testEnv.authenticatedContext("bfp-admin").firestore();
  const noAgency = testEnv.authenticatedContext("noagency-admin").firestore();
  const superAdmin = testEnv.authenticatedContext("super").firestore();
  const reporter = testEnv.authenticatedContext("reporter").firestore();
  const anon = testEnv.unauthenticatedContext().firestore();

  console.log("\nAgency isolation");
  await check(
    "PNP admin CAN read a PNP incident",
    assertSucceeds(getDoc(doc(pnp, "incidents", "pnp-incident"))),
  );
  await check(
    "BFP admin CANNOT read a PNP incident",
    assertFails(getDoc(doc(bfp, "incidents", "pnp-incident"))),
  );
  await check(
    "PNP admin CANNOT read a BFP incident",
    assertFails(getDoc(doc(pnp, "incidents", "bfp-incident"))),
  );

  console.log("\nAgency isolation on writes");
  await check(
    "BFP admin CANNOT change a PNP incident's status",
    assertFails(
      updateDoc(doc(bfp, "incidents", "pnp-incident"), { status: "resolved" }),
    ),
  );
  await check(
    "PNP admin CAN change a PNP incident's status",
    assertSucceeds(
      updateDoc(doc(pnp, "incidents", "pnp-incident"), { status: "resolved" }),
    ),
  );
  await check(
    "BFP admin CANNOT delete a PNP incident",
    assertFails(deleteDoc(doc(bfp, "incidents", "pnp-incident"))),
  );

  console.log("\nQueries (the path the admin inbox actually uses)");
  await check(
    "BFP admin CANNOT list PNP incidents",
    assertFails(
      getDocs(
        query(
          collection(bfp, "incidents"),
          where("involvedAgency", "==", "PNP"),
        ),
      ),
    ),
  );
  await check(
    "BFP admin CAN list its own BFP incidents",
    assertSucceeds(
      getDocs(
        query(
          collection(bfp, "incidents"),
          where("involvedAgency", "==", "BFP"),
        ),
      ),
    ),
  );
  await check(
    "Agency admin CANNOT list incidents unscoped",
    assertFails(getDocs(collection(bfp, "incidents"))),
  );

  console.log("\nAdmin with no agency assigned fails closed");
  await check(
    "Agencyless admin CANNOT read a PNP incident",
    assertFails(getDoc(doc(noAgency, "incidents", "pnp-incident"))),
  );
  await check(
    "Agencyless admin CANNOT read a BFP incident",
    assertFails(getDoc(doc(noAgency, "incidents", "bfp-incident"))),
  );

  console.log("\nSuper admin and reporter access");
  await check(
    "Super admin CAN read any agency's incident",
    assertSucceeds(getDoc(doc(superAdmin, "incidents", "pnp-incident"))),
  );
  await check(
    "Super admin CAN list all incidents",
    assertSucceeds(getDocs(collection(superAdmin, "incidents"))),
  );
  await check(
    "Reporter CAN read their own incident regardless of agency",
    assertSucceeds(getDoc(doc(reporter, "incidents", "bfp-incident"))),
  );
  await check(
    "Anonymous CANNOT read any incident",
    assertFails(getDoc(doc(anon, "incidents", "pnp-incident"))),
  );

  await testEnv.cleanup();

  const failed = results.filter((r) => !r.passed);
  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed`,
  );
  process.exit(failed.length > 0 ? 1 : 0);
}

run().catch((error) => {
  console.error("Test run failed:", error);
  process.exit(1);
});
