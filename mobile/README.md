# VehicleHub Offline (mobile)

100% offline Android-first app: vehicles, fuel/charge logs, service records, local reminders, JSON backup/restore.

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm start` | Expo dev server |
| `npm run android` | Build & run native Android (`expo run:android`) |
| `npm test` | Run Vitest unit tests |
| `npm run eas:init` | Link folder to EAS (one-time; adds `projectId`) |
| `npm run eas:build:preview` | Cloud build: **APK** for sideload ([standalone guide](../docs/standalone-android.md)) |
| `npm run eas:build:production` | Cloud build: **AAB** for Play Store |

See also: [docs/mobile-setup.md](../docs/mobile-setup.md), [docs/standalone-android.md](../docs/standalone-android.md), [docs/mobile-data-model.md](../docs/mobile-data-model.md).
