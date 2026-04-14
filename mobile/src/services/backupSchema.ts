import { z } from "zod";

const energyUnitSchema = z.enum(["L", "kWh"]);

const vehicleBackupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  year: z.number().nullable(),
  registration_number: z.string().nullable(),
  current_mileage: z.number(),
  photo_uri: z.string().nullable(),
  archived: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

const fuelLogBackupSchema = z.object({
  id: z.string().min(1),
  vehicle_id: z.string().min(1),
  date: z.string(),
  odometer_reading: z.number(),
  fuel_quantity_liters: z.number(),
  energy_unit: energyUnitSchema,
  cost: z.number(),
  fuel_station: z.string().nullable(),
  created_at: z.string(),
});

const serviceBackupSchema = z.object({
  id: z.string().min(1),
  vehicle_id: z.string().min(1),
  date: z.string(),
  odometer: z.number().nullable(),
  service_type: z.string().min(1),
  description: z.string().nullable(),
  cost: z.number(),
  next_service_date: z.string().nullable(),
  next_service_mileage: z.number().nullable(),
  created_at: z.string(),
});

export const backupFileSchema = z.object({
  format: z.literal("vehiclehub-offline-v1"),
  exportedAt: z.string(),
  vehicles: z.array(vehicleBackupSchema),
  fuel_logs: z.array(fuelLogBackupSchema),
  service_records: z.array(serviceBackupSchema),
});

export type BackupFileV1 = z.infer<typeof backupFileSchema>;

export function parseBackupJson(text: string): BackupFileV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON");
  }
  return backupFileSchema.parse(parsed);
}
