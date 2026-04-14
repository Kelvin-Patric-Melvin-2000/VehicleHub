import type { SQLiteDatabase } from "expo-sqlite";
import type { EnergyUnit, FuelLog } from "@/domain/types";
import { newId } from "@/utils/id";
import { nowIso } from "@/utils/format";
import { setVehicleMileageIfHigher } from "./vehicles";

function rowToFuelLog(row: Record<string, unknown>): FuelLog {
  const unit = row.energy_unit === "kWh" ? "kWh" : "L";
  return {
    id: String(row.id),
    vehicle_id: String(row.vehicle_id),
    date: String(row.date),
    odometer_reading: Number(row.odometer_reading),
    fuel_quantity_liters: Number(row.fuel_quantity_liters),
    energy_unit: unit,
    cost: Number(row.cost),
    fuel_station: row.fuel_station == null ? null : String(row.fuel_station),
    created_at: String(row.created_at),
  };
}

export async function listFuelLogsForVehicle(
  db: SQLiteDatabase,
  vehicleId: string,
  limit = 200,
): Promise<FuelLog[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM fuel_logs WHERE vehicle_id = ? ORDER BY date DESC, created_at DESC LIMIT ?",
    [vehicleId, limit],
  );
  return rows.map(rowToFuelLog);
}

export type FuelLogInput = {
  date: string;
  odometer_reading: number;
  fuel_quantity_liters: number;
  energy_unit: EnergyUnit;
  cost: number;
  fuel_station?: string | null;
};

export async function createFuelLog(
  db: SQLiteDatabase,
  vehicleId: string,
  input: FuelLogInput,
): Promise<FuelLog> {
  const id = newId();
  const ts = nowIso();
  const log: FuelLog = {
    id,
    vehicle_id: vehicleId,
    date: input.date,
    odometer_reading: input.odometer_reading,
    fuel_quantity_liters: input.fuel_quantity_liters,
    energy_unit: input.energy_unit,
    cost: input.cost,
    fuel_station: input.fuel_station?.trim() || null,
    created_at: ts,
  };
  await db.runAsync(
    `INSERT INTO fuel_logs (
      id, vehicle_id, date, odometer_reading, fuel_quantity_liters, energy_unit, cost, fuel_station, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.id,
      log.vehicle_id,
      log.date,
      log.odometer_reading,
      log.fuel_quantity_liters,
      log.energy_unit,
      log.cost,
      log.fuel_station,
      log.created_at,
    ],
  );
  await setVehicleMileageIfHigher(db, vehicleId, input.odometer_reading);
  return log;
}

export async function deleteFuelLog(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("DELETE FROM fuel_logs WHERE id = ?", [id]);
}
