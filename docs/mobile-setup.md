# VehicleHub Offline (Android)

The mobile app lives in [`mobile/`](../mobile/). It is a **100% offline** Expo (React Native) app using SQLite on device.

## Standalone vs development

| Mode | Needs your laptop running `expo start`? |
|------|----------------------------------------|
| **Development** (`npx expo start`, Expo Go, QR code) | Yes — the phone loads JavaScript from Metro on your PC. |
| **Standalone** (release APK/AAB you install) | **No** — the bundle is **inside the app**. Use it like any installed app. |

Step-by-step for a **standalone install** (EAS APK, sideload, optional Play Store): **[standalone-android.md](standalone-android.md)**.

## Prerequisites

- Node.js 20+ and npm
- Android Studio (for emulator) or a physical Android device with USB debugging
- For Play Store builds: [Expo Application Services (EAS)](https://docs.expo.dev/eas/) account

## Install and run

```bash
cd mobile
npm install
npx expo start
```

Then press `a` for Android emulator, or scan the QR code with **Expo Go** (limitations: some native modules may require a dev build).

For full SQLite + notifications behavior, use a **development build**:

```bash
npx expo run:android
```

## Release APK (side-load)

Using EAS (recommended):

```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure   # once: links an EAS project; updates app.json extra.eas.projectId
eas build -p android --profile preview
```

The `preview` profile in [`mobile/eas.json`](../mobile/eas.json) produces an **APK** for internal install.

## Release AAB (Play Store)

```bash
eas build -p android --profile production
```

Upload the `.aab` from the EAS build page to Google Play Console (internal testing first).

## Backup / restore

From **Settings**: export a JSON backup (share sheet) or import a previously exported file. Import **replaces all local data** after confirmation.

## Troubleshooting

- **Notifications**: Grant notification permission when prompted. Date-based reminders fire at **09:00 local** on the `next_service_date` you set on a service record.
- **Database errors**: Uninstalling the app deletes local SQLite data unless you exported a backup.
