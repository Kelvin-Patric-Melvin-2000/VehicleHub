import type { SQLiteDatabase } from "expo-sqlite";
import type { ServiceRecord } from "@/domain/types";
import { newId } from "@/utils/id";
import { nowIso } from "@/utils/format";

function rowToService(row: Record<string, unknown>): ServiceRecord {
  return {
    id: String(row.id),
    vehicle_id: String(row.vehicle_id),
    date: String(row.date),
    odometer: row.odometer == null ? null : Number(row.odometer),
    service_type: String(row.service_type),
    description: row.description == null ? null : String(row.description),
    cost: Number(row.cost),
    next_service_date: row.next_service_date == null ? null : String(row.next_service_date),
    next_service_mileage: row.next_service_mileage == null ? null : Number(row.next_service_mileage),
    created_at: String(row.created_at),
  };
}

export async function listServiceRecordsForVehicle(
  db: SQLiteDatabase,
  vehicleId: string,
  limit = 200,
): Promise<ServiceRecord[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM service_records WHERE vehicle_id = ? ORDER BY date DESC, created_at DESC LIMIT ?",
    [vehicleId, limit],
  );
  return rows.map(rowToService);
}

export type ServiceRecordInput = {
  date: string;
  odometer?: number | null;
  service_type: string;
  description?: string | null;
  cost: number;
  next_service_date?: string | null;
  next_service_mileage?: number | null;
};

export async function createServiceRecord(
  db: SQLiteDatabase,
  vehicleId: string,
  input: ServiceRecordInput,
): Promise<ServiceRecord> {
  const id = newId();
  const ts = nowIso();
  const rec: ServiceRecord = {
    id,
    vehicle_id: vehicleId,
    date: input.date,
    odometer: input.odometer ?? null,
    service_type: input.service_type.trim(),
    description: input.description?.trim() || null,
    cost: input.cost,
    next_service_date: input.next_service_date || null,
    next_service_mileage: input.next_service_mileage ?? null,
    created_at: ts,
  };
  await db.runAsync(
    `INSERT INTO service_records (
      id, vehicle_id, date, odometer, service_type, description, cost, next_service_date, next_service_mileage, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rec.id,
      rec.vehicle_id,
      rec.date,
      rec.odometer,
      rec.service_type,
      rec.description,
      rec.cost,
      rec.next_service_date,
      rec.next_service_mileage,
      rec.created_at,
    ],
  );
  return rec;
}

export async function deleteServiceRecord(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("DELETE FROM service_records WHERE id = ?", [id]);
}

/** All records that have a next_service_date (for notification scheduling). */
export async function listServiceRecordsWithNextDate(db: SQLiteDatabase): Promise<ServiceRecord[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM service_records WHERE next_service_date IS NOT NULL AND next_service_date != ''",
  );
  return rows.map(rowToService);
}
