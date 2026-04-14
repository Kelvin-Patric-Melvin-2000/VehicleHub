# Standalone Android app (no laptop required)

This guide turns **VehicleHub Offline** from a dev workflow (Metro + Expo Go on the same Wi‑Fi as your PC) into a **normal Android app** you install once. The JS bundle and assets ship **inside** the APK/AAB; the app keeps using **SQLite on the phone** and does not talk to your laptop at runtime.

## Dev vs standalone

| Workflow | Laptop / Metro? | Same Wi‑Fi as phone? |
|----------|-----------------|----------------------|
| `npx expo start` + Expo Go / QR | Yes — loads JS from your PC | Usually yes (or use tunnel) |
| **Installed release APK/AAB** | **No** | **No** |

After you install a release build, open the app like any other — **no** `expo start`, **no** USB to the dev machine.

---

## One-time: EAS onboarding (Expo account)

[EAS Build](https://docs.expo.dev/build/introduction/) compiles your app in the cloud. You need a free [Expo account](https://expo.dev/signup).

From the [`mobile/`](../mobile/) directory:

```bash
cd mobile
npm install
npm run eas:login
```

Link this repo folder to an EAS project (creates/updates `.eas/project.json` and adds `extra.eas.projectId` in `app.json`):

```bash
npm run eas:init
```

If you already use EAS and only need to refresh config:

```bash
npm run eas:configure
```

Verify login:

```bash
npx eas whoami
```

**Checklist (todo: eas-onboard)**

- [ ] `eas` CLI available via devDependency (`npm run eas:*` scripts in [`mobile/package.json`](../mobile/package.json))
- [ ] `eas login` succeeded
- [ ] `eas init` (or `build:configure`) completed and `app.json` contains `expo.extra.eas.projectId`

---

## Build a standalone APK (preview profile)

[`mobile/eas.json`](../mobile/eas.json) defines a **`preview`** profile that outputs an **APK** for sideloading (internal distribution).

```bash
cd mobile
npm run eas:build:preview
```

Or:

```bash
npx eas build -p android --profile preview
```

When the build finishes, open the build page in the browser (link printed in the terminal), then **download the `.apk`**.

**Checklist (todo: build-preview-apk)**

- [ ] Build status **Finished** on expo.dev
- [ ] APK file downloaded to your machine

---

## Install on your phone (sideload)

1. Copy the APK to your phone (USB, Drive, email, etc.).
2. On Android: open the file and allow **Install unknown apps** for that source if prompted.
3. Install and launch **VehicleHub Offline**.

Confirm it runs **without** your laptop: turn off Wi‑Fi if you like — the app should still open (data is local).

**Checklist (todo: install-phone)**

- [ ] App opens from the launcher without Metro
- [ ] You can create a vehicle and restart the app; data persists

---

## Optional: Google Play (production AAB)

For Play Store or internal testing tracks, build an **AAB**:

```bash
cd mobile
npm run eas:build:production
```

Upload the `.aab` from the EAS build page to [Google Play Console](https://play.google.com/console) (start with **Internal testing**).

You will need a **Play Developer** account and app signing (Play App Signing handles much of this; EAS can manage credentials — follow the EAS prompts on first production build).

**Checklist (todo: optional-store)**

- [ ] `production` EAS build finished
- [ ] AAB uploaded and a test release rolled out (internal/open testing) if desired

---

## Alternative: local release build (no EAS)

If you prefer building only on your machine:

1. Install [Android Studio](https://developer.android.com/studio) and SDKs.
2. `cd mobile && npx expo prebuild -p android`
3. Configure a **release keystore** and Gradle signing (required for upgrades and store).
4. Build with Android Studio or `./gradlew assembleRelease`, then install the APK.

See [Expo prebuild](https://docs.expo.dev/workflow/prebuild/) and Android signing docs.

---

## Troubleshooting: EAS "Bundle JavaScript" failed

EAS runs the same Metro bundling step you can run locally. To see the **real error** (not "Unknown error"):

```bash
cd mobile
npm install
npx expo export --platform android
```

Fix any "Unable to resolve module" or transform errors it prints, then rebuild.

This project expects **React Navigation** peers: `react-native-gesture-handler` is installed and loaded **first** in [`mobile/index.js`](../mobile/index.js). The root component is [`mobile/src/App.tsx`](../mobile/src/App.tsx) so `@/` path aliases stay under `src/`.

**`@expo/vector-icons`** depends on **`expo-font`** — that package is listed in [`mobile/package.json`](../mobile/package.json). If Metro reports missing `expo-font`, run `npm install` or `npx expo install expo-font`.

---

## Related

- [`docs/mobile-setup.md`](mobile-setup.md) — dev server, compatibility, backup
- [`mobile/eas.json`](../mobile/eas.json) — build profiles (`preview` = APK, `production` = AAB)
- [`mobile/README.md`](../mobile/README.md) — npm scripts overview
