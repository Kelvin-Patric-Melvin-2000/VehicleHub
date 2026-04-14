import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { parseISO, isValid, setHours, setMinutes, setSeconds, isBefore } from "date-fns";
import { getDb } from "@/db/client";
import { listVehicles } from "@/repos/vehicles";
import { listServiceRecordsWithNextDate } from "@/repos/serviceRecords";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = "service-due";

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Service reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#38bdf8",
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.status === Notifications.PermissionStatus.GRANTED) {
    return true;
  }
  const req = await Notifications.requestPermissionsAsync();
  return req.granted || req.status === Notifications.PermissionStatus.GRANTED;
}

/**
 * Re-schedules local notifications for each service record with a next_service_date.
 * Uses 09:00 local time on that date. Mileage-based due is shown in-app only.
 */
export async function rescheduleAllServiceNotifications(): Promise<void> {
  await ensureAndroidChannel();
  const ok = await requestNotificationPermissions();
  if (!ok) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const db = getDb();
  const vehicles = await listVehicles(db, true);
  const nameById = new Map(vehicles.map((v) => [v.id, v.name]));
  const records = await listServiceRecordsWithNextDate(db);

  for (const rec of records) {
    const raw = rec.next_service_date;
    if (!raw) continue;
    let d = parseISO(raw);
    if (!isValid(d)) continue;
    d = setHours(setMinutes(setSeconds(d, 0), 0), 9);
    const now = new Date();
    if (isBefore(d, now)) continue;

    const vehicleName = nameById.get(rec.vehicle_id) ?? "Vehicle";
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Service reminder",
        body: `${vehicleName}: ${rec.service_type} due ${raw.slice(0, 10)}`,
        data: { serviceRecordId: rec.id, vehicleId: rec.vehicle_id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: d,
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
      },
    });
  }
}
