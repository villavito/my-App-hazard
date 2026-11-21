# Android release build — CLI only (no EAS, no Android Studio UI)

How this project builds a signed Android app for the Play Store from the terminal. It follows the method in the video *"Build & sign your Expo React Native app for Play Store — no EAS, no Android Studio UI. Just CLI"*. That method is the standard React Native signing flow. The one difference: here, signing is applied with an Expo config plugin, so `expo prebuild` can't wipe it.

**Short version**

```
npm run build:android        # signed .aab for the Play Store  -> release/
npm run build:android:apk    # signed .apk to install on a phone -> release/
```

---

## 1. Every command, explained

`npm run build:android` runs `scripts/buildAndroidRelease.js`. That script runs these commands in order. You can also run any of them by hand.

### 1a. Create the upload keystore (first build only)

```
keytool -genkeypair -v -storetype PKCS12 -keystore credentials/upload-keystore.jks ^
  -alias upload -keyalg RSA -keysize 2048 -validity 10000 ^
  -storepass <password> -keypass <password> -dname "CN=Incident Reporting App, ..."
```

| Flag | Meaning |
|---|---|
| `keytool` | Ships with the JDK (here: OpenJDK 17). It manages keys and certificates. |
| `-genkeypair` | Create a new private key plus a self-signed certificate. |
| `-storetype PKCS12` | The modern keystore format. In PKCS12, the store password and the key password must be the same. |
| `-keystore …jks` | The file the key is saved in. |
| `-alias upload` | The key's name inside the file. Gradle refers to it by this name. |
| `-keyalg RSA -keysize 2048` | Key type and size that Google Play accepts. |
| `-validity 10000` | About 27 years. Google requires validity past the year 2033. |
| `-storepass / -keypass` | The passwords. The script generates a random one. |
| `-dname` | The name on the certificate. Users never see it. |

The script then writes `keystore.properties`, which tells Gradle where the key is and what the passwords are:

```
storeFile=credentials/upload-keystore.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

### 1b. Print the key fingerprints

```
keytool -list -v -keystore credentials/upload-keystore.jks -alias upload -storepass <password>
```

This shows the key's **SHA-1** and **SHA-256** fingerprints. Firebase needs the SHA-1 for native Google sign-in (see §5).

### 1c. Generate the native Android project

```
npx expo prebuild -p android --no-install
```

- Expo apps don't keep a hand-written `android/` folder. `prebuild` **generates** it from `app.json` and the config plugins. This is called Continuous Native Generation.
- `-p android` means only generate Android. `--no-install` means skip `npm install`.
- This step **deletes and regenerates `android/`**, so editing `android/app/build.gradle` by hand gets undone. The video's tutorial (and the React Native docs) edit Gradle files directly. This project uses config plugins instead (registered in `app.json` → `plugins`), which re-apply the changes on every prebuild: `plugins/withReleaseSigning.js` (signing) and `plugins/withShortNativeBuildPath.js` (the Windows path-limit fix, see §5).

### 1d. Compile and sign

```
android\gradlew.bat bundleRelease      (Windows)
./android/gradlew bundleRelease        (macOS/Linux)
```

| Task | Output | Use for |
|---|---|---|
| `bundleRelease` | `android/app/build/outputs/bundle/release/app-release.aab` | Uploading to the Play Store |
| `assembleRelease` | `android/app/build/outputs/apk/release/app-release.apk` | Installing directly on a phone |

`gradlew` is the Gradle Wrapper. It downloads the exact Gradle version the project needs, so you don't install Gradle yourself. The script then copies the result to `release/incident-reporting-<version>-<versionCode>.aab`.

### 1e. Install an APK on a phone (optional)

```
adb install -r release/incident-reporting-1.0.0-1.apk
```

`adb` is in `%LOCALAPPDATA%\Android\Sdk\platform-tools`. On the phone, turn on USB debugging first: tap Build number 7 times, then go to Developer options. Or just copy the APK to the phone and open it.

### 1f. Verify the signature (optional)

```
keytool -printcert -jarfile release/incident-reporting-1.0.0-1.aab
```

This should show `CN=Incident Reporting App`. If it shows `CN=Android Debug`, the debug key was used and Play will reject the file.

---

## 2. What happens during the build

1. **JavaScript bundle.** Gradle calls Metro (Expo's bundler). Metro packs every `.tsx`/`.ts` file into a single `index.android.bundle`. Hermes then compiles that bundle to bytecode so the app starts faster.
   - **`EXPO_PUBLIC_*` variables are baked in at this step.** The Google client IDs (and the optional EmailJS keys) from `.env.local` become part of the app. To change them, you have to rebuild. The app needs no backend server: videos and password resets go through Firebase.
2. **Native code.** Libraries like Reanimated, Gesture Handler and Expo modules contain C++ code. CMake compiles it once for each CPU type: `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`. This is the slow part, often 10–20 minutes on the first build. Later builds reuse the cache.
3. **Resources.** Icons, the splash screen, fonts and `AndroidManifest.xml` (permissions for camera, location, microphone) are merged and compiled.
4. **Packaging and signing.** Everything is zipped into an AAB or APK and signed with the release signing config, which is your upload key.

**AAB or APK?** An AAB is what the Play Store requires. Google generates a smaller APK for each device from it. You can't install an AAB directly on a phone. An APK installs directly, which is good for testing or sharing outside the Play Store.

---

## 3. How signing works

Signing proves that an update came from the same developer as the original app. Android refuses to install an update signed with a different key.

```
your upload key  --signs-->  .aab  --upload-->  Google Play  --re-signs with-->  app signing key  -->  users
```

- **Upload key** (`credentials/upload-keystore.jks`): yours. It proves to Google that an upload came from you.
- **App signing key**: Google creates and keeps it (Play App Signing, which is required for new apps). It is what users' phones actually check.
- If you **lose the upload key**, Google can reset it after you request it in Play Console. It takes a few days. If you're distributing **APKs outside Play**, losing the key means users must uninstall and reinstall to get updates.

**Back up** both `credentials/upload-keystore.jks` and `keystore.properties` somewhere private, such as a password manager or private cloud drive. Both are gitignored on purpose: anyone who has them can sign apps as you.

How `plugins/withReleaseSigning.js` changes `android/app/build.gradle`:

```groovy
def releaseKeystorePropsFile = rootProject.file("../keystore.properties")
...
signingConfigs {
    release {
        storeFile rootProject.file("../" + releaseKeystoreProps["storeFile"])
        storePassword releaseKeystoreProps["storePassword"]
        keyAlias releaseKeystoreProps["keyAlias"]
        keyPassword releaseKeystoreProps["keyPassword"]
    }
    debug { ... }
}
buildTypes {
    release {
        signingConfig releaseKeystorePropsFile.exists() ? signingConfigs.release : signingConfigs.debug
    }
}
```

---

## 4. Publishing on the Play Store

**Before the first upload**

1. Deploy the Firestore rules (see DEPLOYMENT.md), so video uploads are allowed.
2. Create a Google Play developer account at https://play.google.com/console. It costs a one-time US$25 and requires identity verification.
3. In Play Console, choose **Create app**. Set name, language, App or Game, and Free or Paid.

**Store listing and policy forms** (all required)

| Item | What this app needs |
|---|---|
| App icon | 512×512 PNG |
| Feature graphic | 1024×500 |
| Screenshots | At least 2 phone screenshots |
| Short and full description | — |
| **Privacy policy URL** | A public web page. You can host the app's privacy text on Firebase Hosting, for example `https://incident-4a5a6.web.app/terms-privacy`. |
| **Data safety** | Declare what the app collects: **location**, **videos**, **email / name / phone**, and account sign-in through Google. Say it is sent to your servers (Firebase). |
| **Permissions** | Camera, microphone (video recording) and location are used. Be ready to explain each. |
| Content rating | Fill in the questionnaire. |
| Target audience | Choose 18+ unless the app is meant for minors. |
| App access | The app needs a login, so give reviewers a **test account** (email and password). |

**Testing before production**

- **New personal developer accounts** must run a **closed test with at least 12 testers for 14 days in a row** before production access opens. Organization accounts are exempt.
- Start with **Internal testing**: Test and release → Testing → Internal testing → Create release → upload the `.aab` → add tester emails. It's the fastest way to try a real Play install.

**Every update**

1. Raise `android.versionCode` in `app.json` (1 → 2 → 3 …). Play rejects any code it has seen before. Raise `version` (for example `1.0.1`) for users to see.
2. Run `npm run build:android`.
3. Upload the new `.aab` to a release.

**After the first upload:** copy the **App signing key SHA-1** from Play Console → Test and release → App integrity, and add it to Firebase too (see §5, Google sign-in).

---

## 5. Errors and troubleshooting

**Errors already hit on this project**

| Symptom | Cause | Fix |
|---|---|---|
| `'gradlew.bat' is not recognized` | Windows was set (`NoDefaultCurrentDirectoryInExePath`) not to run programs from the current folder by name. | Fixed: the script now calls `gradlew.bat` by its full path. By hand, run `.\gradlew.bat`. |
| `ninja: error: mkdir(CMakeFiles/reanimated.dir/C_/Users/…/rnreanimated): No such file or directory`, after the warning `The maximum full path to an object file is 200 characters … cannot be safely placed` | Windows path-length limit. The project path plus `node_modules\react-native-reanimated\...` is too long for the C++ build. The first build failed here after 12 minutes. The Android SDK's ninja 1.10 can't use long paths even with Windows `LongPathsEnabled`. Mapping the project to a drive letter (`subst`) doesn't help either: autolinking resolves libraries back to their real `C:\Users\…` paths. | **Fixed automatically:** `plugins/withShortNativeBuildPath.js` moves every library's native build folder to `%USERPROFILE%\.cxx\<library>`, which is about 36 characters shorter. It applies on Windows only. If a future library still hits the limit, move the project to a short path like `C:\hazard`. |

**Other common problems**

| Symptom | Cause | Fix |
|---|---|---|
| `JAVA_HOME is not set` or `Unsupported class file major version` | Gradle didn't find Java, or found the wrong version. | Install JDK 17 and set `JAVA_HOME` to its folder. |
| `SDK location not found` | `android/local.properties` is missing after prebuild. | The script writes it automatically. Otherwise set `ANDROID_HOME` to `%LOCALAPPDATA%\Android\Sdk`. |
| `Keystore was tampered with, or password was incorrect` | `keystore.properties` doesn't match the keystore. | Restore both files from your backup. Don't create a new key if the app is already on Play. |
| Play: *"You uploaded an APK or Android App Bundle that was signed in debug mode"* | `keystore.properties` was missing, so the debug key was used. | Restore `keystore.properties`, then rebuild. |
| Play: *"Version code 1 has already been used"* | `versionCode` wasn't raised. | Increase `android.versionCode` in `app.json`. |
| Play: *"signed with the wrong key"* | A different upload key from the first upload was used. | Use the original keystore, or request an upload key reset in Play Console → App integrity. |
| Google sign-in fails with **`DEVELOPER_ERROR`** (code 10) | The SHA-1 of the signing key isn't registered in Firebase. | Firebase → Project settings → Android app → Add fingerprint: the upload key SHA-1 (printed by the build) **and** the Play App signing key SHA-1. Then download the updated config if the app uses `google-services.json`. |
| Submitting a report fails with *"Missing or insufficient permissions"* | The Firestore rules with the video rules aren't deployed. | Deploy them (see DEPLOYMENT.md). |
| *"This video is … MB, but the limit is 25 MB"* | Videos are stored in Firestore on the free plan. | Record in the app (30 seconds fits easily) or pick a shorter video. |
| Build runs out of memory (`Java heap space`, `Metaspace`) | Gradle's default memory is too small. | Add `org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g` to `%USERPROFILE%\.gradle\gradle.properties`. That file survives prebuild. |
| Changes to `android/` disappear | `expo prebuild` regenerates the folder. | Put native changes in `app.json` or a config plugin, not in `android/`. |
| Very slow builds | C++ is compiled for 4 CPU types. | For a quick test APK, build for one: `android\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a`. Keep all four for Play uploads. |
| Build failed and stays broken | Stale cache. | `cd android && gradlew.bat clean`, or delete `android/` and rerun `npm run build:android`. |
