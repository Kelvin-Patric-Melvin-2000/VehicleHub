import type { SQLiteDatabase } from "expo-sqlite";
import type { Vehicle } from "@/domain/types";
import { newId } from "@/utils/id";
import { nowIso } from "@/utils/format";

function rowToVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    make: row.make == null ? null : String(row.make),
    model: row.model == null ? null : String(row.model),
    year: row.year == null ? null : Number(row.year),
    registration_number: row.registration_number == null ? null : String(row.registration_number),
    current_mileage: Number(row.current_mileage),
    photo_uri: row.photo_uri == null ? null : String(row.photo_uri),
    archived: Number(row.archived) === 1,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listVehicles(db: SQLiteDatabase, includeArchived = false): Promise<Vehicle[]> {
  const sql = includeArchived
    ? "SELECT * FROM vehicles ORDER BY updated_at DESC"
    : "SELECT * FROM vehicles WHERE archived = 0 ORDER BY updated_at DESC";
  const rows = await db.getAllAsync<Record<string, unknown>>(sql);
  return rows.map(rowToVehicle);
}

export async function getVehicle(db: SQLiteDatabase, id: string): Promise<Vehicle | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>("SELECT * FROM vehicles WHERE id = ?", [id]);
  if (!row) return null;
  return rowToVehicle(row);
}

export type VehicleInput = {
  name: string;
  type?: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  registration_number?: string | null;
  current_mileage?: number;
  photo_uri?: string | null;
};

export async function createVehicle(db: SQLiteDatabase, input: VehicleInput): Promise<Vehicle> {
  const id = newId();
  const ts = nowIso();
  const v: Vehicle = {
    id,
    name: input.name.trim(),
    type: input.type?.trim() || "motorcycle",
    make: input.make?.trim() || null,
    model: input.model?.trim() || null,
    year: input.year ?? null,
    registration_number: input.registration_number?.trim() || null,
    current_mileage: input.current_mileage ?? 0,
    photo_uri: input.photo_uri ?? null,
    archived: false,
    created_at: ts,
    updated_at: ts,
  };
  await db.runAsync(
    `INSERT INTO vehicles (
      id, name, type, make, model, year, registration_number, current_mileage, photo_uri, archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
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
      v.created_at,
      v.updated_at,
    ],
  );
  return v;
}

export async function updateVehicle(db: SQLiteDatabase, id: string, input: VehicleInput): Promise<void> {
  const existing = await getVehicle(db, id);
  if (!existing) throw new Error("Vehicle not found");
  const ts = nowIso();
  await db.runAsync(
    `UPDATE vehicles SET
      name = ?, type = ?, make = ?, model = ?, year = ?, registration_number = ?,
      current_mileage = ?, photo_uri = ?, updated_at = ?
    WHERE id = ?`,
    [
      input.name.trim(),
      input.type?.trim() || existing.type,
      input.make?.trim() ?? null,
      input.model?.trim() ?? null,
      input.year ?? null,
      input.registration_number?.trim() ?? null,
      input.current_mileage ?? existing.current_mileage,
      input.photo_uri ?? existing.photo_uri,
      ts,
      id,
    ],
  );
}

export async function setVehicleMileageIfHigher(db: SQLiteDatabase, vehicleId: string, odometer: number): Promise<void> {
  const v = await getVehicle(db, vehicleId);
  if (!v) return;
  if (odometer > v.current_mileage) {
    const ts = nowIso();
    await db.runAsync("UPDATE vehicles SET current_mileage = ?, updated_at = ? WHERE id = ?", [
      odometer,
      ts,
      vehicleId,
    ]);
  }
}

export async function archiveVehicle(db: SQLiteDatabase, id: string, archived: boolean): Promise<void> {
  const ts = nowIso();
  await db.runAsync("UPDATE vehicles SET archived = ?, updated_at = ? WHERE id = ?", [
    archived ? 1 : 0,
    ts,
    id,
  ]);
}

export async function deleteVehicle(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("DELETE FROM vehicles WHERE id = ?", [id]);
}
