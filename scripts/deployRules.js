/**
 * One-command deploy of firestore.rules (and indexes).
 *
 * Run this in your own terminal - not through an automated agent - because the
 * login step opens a browser and waits for you. That interactive step is the
 * only reason this can't be fully automated.
 *
 *   npm run deploy:rules
 *
 * It checks whether the Firebase CLI can actually reach your project, runs
 * `login --reauth` if it can't (an expired stored token looks like a valid
 * login but 401s on every request), then deploys.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// npx and .cmd shims need a shell on Windows.
const useShell = process.platform === "win32";

function firebase(args, { quiet = false } = {}) {
  return spawnSync("npx", ["firebase-tools", ...args], {
    stdio: quiet ? "pipe" : "inherit",
    shell: useShell,
    encoding: "utf8",
  });
}

function projectId() {
  const rcPath = path.join(__dirname, "..", ".firebaserc");
  if (!fs.existsSync(rcPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(rcPath, "utf8")).projects?.default ?? null;
  } catch {
    return null;
  }
}

function isAuthenticated() {
  const result = firebase(["projects:list"], { quiet: true });
  return result.status === 0;
}

function run() {
  const project = projectId();
  if (!project) {
    console.error(
      "No default project found in .firebaserc. Run `npx firebase-tools use --add` first.",
    );
    process.exit(1);
  }

  console.log(`Project: ${project}\n`);

  if (isAuthenticated()) {
    console.log("Firebase CLI is authenticated.\n");
  } else {
    console.log(
      "The Firebase CLI cannot reach your project. A stored token that has\n" +
        "expired looks like a valid login but fails every request, so this\n" +
        "forces a fresh sign-in.\n\n" +
        "A browser window will open - sign in with the account that owns\n" +
        `${project}, then come back here.\n`,
    );

    const login = firebase(["login", "--reauth"]);
    if (login.status !== 0) {
      console.error(
        "\nLogin failed or was cancelled. If the browser flow won't work on this\n" +
          "machine, try:  npx firebase-tools login --no-localhost\n\n" +
          "You can also skip the CLI entirely: paste firestore.rules into the\n" +
          "Firebase Console -> Firestore Database -> Rules tab and click Publish.",
      );
      process.exit(1);
    }

    if (!isAuthenticated()) {
      console.error(
        "\nStill cannot reach the project after signing in. Check that this\n" +
          `account has access to ${project}.`,
      );
      process.exit(1);
    }
  }

  console.log("Deploying firestore.rules and firestore.indexes.json...\n");
  const deploy = firebase(["deploy", "--only", "firestore", "--project", project]);

  if (deploy.status !== 0) {
    console.error("\nDeploy failed. See the output above.");
    process.exit(1);
  }

  console.log(
    "\nDeployed.\n\n" +
      "Next steps, in this order:\n" +
      "  1. Make sure every admin's user doc has an `agency` field (exact case:\n" +
      "     PNP, BFP, LDRRMC, Barangay, REDCROSS). The new rules scope admins to\n" +
      "     their own agency, so an admin without that field sees an empty inbox.\n" +
      "  2. Log in once as each agency admin. Sign-in registers that agency, which\n" +
      "     is what makes it appear in the user's report dropdown.",
  );
}

run();
