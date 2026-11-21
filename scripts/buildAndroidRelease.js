#!/usr/bin/env node
// Builds a signed Android release from the command line - no EAS, no
// Android Studio UI.
//
//   npm run build:android        -> .aab for the Play Store
//   npm run build:android:apk    -> .apk to install directly on a phone
//
// Steps: create the upload keystore on first run -> expo prebuild (applies
// plugins/withReleaseSigning.js) -> gradlew bundleRelease/assembleRelease ->
// copy the result into release/.
const { execFileSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ANDROID_DIR = path.join(ROOT, "android");
const PROPS_FILE = path.join(ROOT, "keystore.properties");
const KEYSTORE_REL = "credentials/upload-keystore.jks";
const KEY_ALIAS = "upload";
const OUT_DIR = path.join(ROOT, "release");
const isWindows = process.platform === "win32";
const wantApk = process.argv.includes("--apk");

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, {
    stdio: "inherit",
    shell: isWindows,
    ...opts,
  });
}

function findKeytool() {
  const exe = isWindows ? "keytool.exe" : "keytool";
  if (process.env.JAVA_HOME) {
    const p = path.join(process.env.JAVA_HOME, "bin", exe);
    if (fs.existsSync(p)) return p;
  }
  return "keytool"; // on PATH
}

function readProps(file) {
  const props = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
    if (m) props[m[1]] = m[2].trim();
  }
  return props;
}

function ensureKeystore() {
  if (fs.existsSync(PROPS_FILE)) {
    const props = readProps(PROPS_FILE);
    if (!fs.existsSync(path.join(ROOT, props.storeFile || ""))) {
      throw new Error(
        `keystore.properties points at ${props.storeFile}, which doesn't exist. ` +
          "Restore the keystore from your backup - do not create a new one if the app is already on the Play Store.",
      );
    }
    return props;
  }

  console.log("No upload keystore yet - creating one (first build only).");
  const password = crypto.randomBytes(18).toString("base64url");
  const storePath = path.join(ROOT, KEYSTORE_REL);
  fs.mkdirSync(path.dirname(storePath), { recursive: true });

  // One password for store and key: PKCS12 keystores (the keytool default)
  // don't support a separate key password.
  execFileSync(
    findKeytool(),
    [
      "-genkeypair",
      "-v",
      "-storetype", "PKCS12",
      "-keystore", storePath,
      "-alias", KEY_ALIAS,
      "-keyalg", "RSA",
      "-keysize", "2048",
      "-validity", "10000",
      "-storepass", password,
      "-keypass", password,
      "-dname", "CN=Incident Reporting App, OU=Mobile, O=Incident Reporting App, C=PH",
    ],
    { stdio: "inherit" },
  );

  const props = {
    storeFile: KEYSTORE_REL,
    storePassword: password,
    keyAlias: KEY_ALIAS,
    keyPassword: password,
  };
  fs.writeFileSync(
    PROPS_FILE,
    "# Android upload key - NEVER commit. Back up this file AND the keystore;\n" +
      "# losing them means you can't publish updates under the same signing key.\n" +
      Object.entries(props).map(([k, v]) => `${k}=${v}`).join("\n") +
      "\n",
  );
  console.log(`\nCreated ${KEYSTORE_REL} and keystore.properties.`);
  console.log("BACK BOTH UP somewhere safe (e.g. a password manager / private drive).");
  return props;
}

function printFingerprints(props) {
  try {
    const out = execFileSync(
      findKeytool(),
      [
        "-list", "-v",
        "-keystore", path.join(ROOT, props.storeFile),
        "-alias", props.keyAlias,
        "-storepass", props.storePassword,
      ],
      { encoding: "utf8" },
    );
    const sha1 = out.match(/SHA1:\s*([0-9A-F:]+)/);
    const sha256 = out.match(/SHA256:\s*([0-9A-F:]+)/);
    console.log("\nUpload key fingerprints (add SHA-1 to Firebase > Project settings > Android app, for Google sign-in):");
    if (sha1) console.log(`  SHA-1:   ${sha1[1]}`);
    if (sha256) console.log(`  SHA-256: ${sha256[1]}`);
  } catch {
    // informational only
  }
}

function ensureLocalProperties() {
  const file = path.join(ANDROID_DIR, "local.properties");
  if (fs.existsSync(file)) return;
  const sdk =
    process.env.ANDROID_HOME ||
    process.env.ANDROID_SDK_ROOT ||
    (isWindows
      ? path.join(os.homedir(), "AppData", "Local", "Android", "Sdk")
      : path.join(os.homedir(), "Library", "Android", "sdk"));
  if (!fs.existsSync(sdk)) {
    throw new Error(`Android SDK not found at ${sdk}. Set ANDROID_HOME.`);
  }
  fs.writeFileSync(file, `sdk.dir=${sdk.replace(/\\/g, "/")}\n`);
}

function main() {
  // Production backend URL gets baked into the JS bundle at build time.
  require("dotenv").config({ path: path.join(ROOT, ".env.local") });
  require("dotenv").config({ path: path.join(ROOT, ".env") });
  if (!process.env.EXPO_PUBLIC_API_URL) {
    console.warn(
      "\nWARNING: EXPO_PUBLIC_API_URL is not set (.env.local). This build will look for a dev-machine backend and video upload won't work for real users.\n",
    );
  }

  const props = ensureKeystore();
  printFingerprints(props);

  run("npx", ["expo", "prebuild", "-p", "android", "--no-install"], {
    cwd: ROOT,
    env: { ...process.env, EXPO_NO_DEPENDENCY_VALIDATION: "1", CI: "1" },
  });
  ensureLocalProperties();

  const task = wantApk ? "assembleRelease" : "bundleRelease";
  // Absolute path: Windows may be set (NoDefaultCurrentDirectoryInExePath)
  // to not run programs from the current folder by bare name.
  const gradlew = path.join(ANDROID_DIR, isWindows ? "gradlew.bat" : "gradlew");
  run(isWindows ? `"${gradlew}"` : gradlew, [task], {
    cwd: ANDROID_DIR,
    env: { ...process.env, NODE_ENV: "production" },
  });

  const built = wantApk
    ? path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "release", "app-release.apk")
    : path.join(ANDROID_DIR, "app", "build", "outputs", "bundle", "release", "app-release.aab");
  const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, "app.json"), "utf8"));
  const version = appJson.expo.version;
  const code = appJson.expo.android?.versionCode ?? 1;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dest = path.join(OUT_DIR, `incident-reporting-${version}-${code}.${wantApk ? "apk" : "aab"}`);
  fs.copyFileSync(built, dest);

  console.log(`\nSigned release ready: ${dest}`);
  if (!wantApk) {
    console.log("Upload it in Play Console > your app > Test and release > Create new release.");
    console.log('Bump "android.versionCode" in app.json before every Play upload.');
  }
}

try {
  main();
} catch (error) {
  console.error(`\nBuild failed: ${error.message}`);
  process.exit(1);
}
