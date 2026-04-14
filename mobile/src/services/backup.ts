import * as FileSystem from "expo-file-system";
import { getDb } from "@/db/client";
import { listVehicles } from "@/repos/vehicles";
import type { EnergyUnit, FuelLog, ServiceRecord, Vehicle } from "@/domain/types";
import { listFuelLogsForVehicle } from "@/repos/fuelLogs";
import { listServiceRecordsForVehicle } from "@/repos/serviceRecords";
import type { BackupFileV1 } from "./backupSchema";
import { parseBackupJson } from "./backupSchema";

export type { BackupFileV1 } from "./backupSchema";
export { parseBackupJson };

export async function buildBackupPayload(): Promise<BackupFileV1> {
  const db = getDb();
  const vehicles = await listVehicles(db, true);
  const fuel_logs: FuelLog[] = [];
  const service_records: ServiceRecord[] = [];
  for (const v of vehicles) {
    fuel_logs.push(...(await listFuelLogsForVehicle(db, v.id, 10_000)));
    service_records.push(...(await listServiceRecordsForVehicle(db, v.id, 10_000)));
  }
  return {
    format: "vehiclehub-offline-v1",
    exportedAt: new Date().toISOString(),
    vehicles: vehicles.map(mapVehicleToBackup),
    fuel_logs: fuel_logs.map(mapFuelToBackup),
    service_records: service_records.map(mapServiceToBackup),
  };
}

function mapVehicleToBackup(v: Vehicle) {
  return {
    id: v.id,
    name: v.name,
    type: v.type,
    make: v.make,
    model: v.model,
    year: v.year,
    registration_number: v.registration_number,
    current_mileage: v.current_mileage,
    photo_uri: v.photo_uri,
    archived: v.archived,
    created_at: v.created_at,
    updated_at: v.updated_at,
  };
}

function mapFuelToBackup(f: FuelLog) {
  return {
    id: f.id,
    vehicle_id: f.vehicle_id,
    date: f.date,
    odometer_reading: f.odometer_reading,
    fuel_quantity_liters: f.fuel_quantity_liters,
    energy_unit: f.energy_unit as EnergyUnit,
    cost: f.cost,
    fuel_station: f.fuel_station,
    created_at: f.created_at,
  };
}

function mapServiceToBackup(s: ServiceRecord) {
  return {
    id: s.id,
    vehicle_id: s.vehicle_id,
    date: s.date,
    odometer: s.odometer,
    service_type: s.service_type,
    description: s.description,
    cost: s.cost,
    next_service_date: s.next_service_date,
    next_service_mileage: s.next_service_mileage,
    created_at: s.created_at,
  };
}

export async function exportBackupJsonString(): Promise<string> {
  const payload = await buildBackupPayload();
  return JSON.stringify(payload, null, 2);
}

export async function writeBackupToCacheFile(): Promise<string> {
  const json = await exportBackupJsonString();
  const path = `${FileSystem.cacheDirectory}vehiclehub-backup.json`;
  await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
  return path;
}

/**
 * Replace all local data with validated backup contents (destructive).
 */
export async function importBackupFromValidated(data: BackupFileV1): Promise<void> {
  const db = getDb();
  await db.execAsync("PRAGMA foreign_keys = OFF;");
  await db.runAsync("DELETE FROM fuel_logs");
  await db.runAsync("DELETE FROM service_records");
  await db.runAsync("DELETE FROM vehicles");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  for (const v of data.vehicles) {
    await db.runAsync(
      `INSERT INTO vehicles (
        id, name, type, make, model, year, registration_number, current_mileage, photo_uri, archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        v.id,
        v.name,
        v.type,
        v.make,
        v.model,
        v.year,
        v.registration_number,
        v.current_mileage,
        v.photo_uri,
        v.archived ? 1 : 0,
        v.created_at,
        v.updated_at,
      ],
    );
  }

  for (const f of data.fuel_logs) {
    await db.runAsync(
      `INSERT INTO fuel_logs (
        id, vehicle_id, date, odometer_reading, fuel_quantity_liters, energy_unit, cost, fuel_station, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        f.id,
        f.vehicle_id,
        f.date,
        f.odometer_reading,
        f.fuel_quantity_liters,
        f.energy_unit,
        f.cost,
        f.fuel_station,
        f.created_at,
      ],
    );
  }

  for (const s of data.service_records) {
    await db.runAsync(
      `INSERT INTO service_records (
        id, vehicle_id, date, odometer, service_type, description, cost, next_service_date, next_service_mileage, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.vehicle_id,
        s.date,
        s.odometer,
        s.service_type,
        s.description,
        s.cost,
        s.next_service_date,
        s.next_service_mileage,
        s.created_at,
      ],
    );
  }
}

export async function importBackupFromJsonString(text: string): Promise<void> {
  const data = parseBackupJson(text);
  await importBackupFromValidated(data);
}
