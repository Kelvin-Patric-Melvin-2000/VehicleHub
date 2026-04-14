import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { FuelLog } from "../../models/FuelLog.js";
import { findEditableVehicle } from "../../lib/ownership.js";
import { validateNewFuelLogOdometer } from "../../lib/fuelLogOdometer.js";
import { toFuelLogJson } from "../../lib/serialize.js";

const router = Router();
router.use(requireAuth);

function normalizeEnergyUnit(raw: unknown): "L" | "kWh" {
  return raw === "kWh" ? "kWh" : "L";
}

type Row = {
  date: string;
  odometer_reading: number;
  fuel_quantity_liters: number;
  cost: number;
  energy_unit?: "L" | "kWh";
  fuel_station?: string | null;
};

router.post("/imports/fuel-logs", async (req, res) => {
  const b = req.body ?? {};
  const vehicle_id = typeof b.vehicle_id === "string" ? b.vehicle_id : "";
  const rows = Array.isArray(b.rows) ? b.rows : [];
  if (!vehicle_id || rows.length === 0) {
    res.status(400).json({ error: "vehicle_id and non-empty rows[] required" });
    return;
  }

  const v = await findEditableVehicle(req.userId!, vehicle_id);
  if (!v) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  const parsed: Row[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const date = typeof (r as Row).date === "string" ? (r as Row).date : "";
    const odometer_reading = Number((r as Row).odometer_reading);
    const fuel_quantity_liters = Number((r as Row).fuel_quantity_liters);
    const cost = Number((r as Row).cost);
    if (!date || !Number.isFinite(odometer_reading) || !Number.isFinite(fuel_quantity_liters) || !Number.isFinite(cost)) {
      res.status(400).json({ error: "Invalid row (date, odometer_reading, fuel_quantity_liters, cost)" });
      return;
    }
    parsed.push({
      date,
      odometer_reading,
      fuel_quantity_liters,
      cost,
      energy_unit: normalizeEnergyUnit((r as Row).energy_unit),
      fuel_station: (r as Row).fuel_station != null ? String((r as Row).fuel_station) : null,
    });
  }

  if (parsed.length === 0) {
    res.status(400).json({ error: "No valid rows" });
    return;
  }

  const existingUnit = await FuelLog.findOne({ vehicle_id: v._id }).sort({ date: 1 }).select("energy_unit").lean();
  const firstUnit = parsed[0]!.energy_unit;
  if (existingUnit && normalizeEnergyUnit((existingUnit as { energy_unit?: string }).energy_unit) !== firstUnit) {
    res.status(400).json({ error: "Energy unit must match existing logs for this vehicle" });
    return;
  }
  for (const p of parsed) {
    if (p.energy_unit !== firstUnit) {
      res.status(400).json({ error: "All imported rows must use the same energy unit" });
      return;
    }
  }

  parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const existingLogs = await FuelLog.find({ vehicle_id: v._id })
    .sort({ date: 1, created_at: 1 })
    .select("date odometer_reading created_at")
    .lean();

  const chainPoints = existingLogs.map((e) => ({
    date: new Date(e.date as Date),
    odometer_reading: Number(e.odometer_reading),
    created_at: new Date((e as { created_at?: Date }).created_at ?? e.date),
    isNew: false,
  }));

  const created: ReturnType<typeof toFuelLogJson>[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i]!;
    const newDate = new Date(p.date);
    const prospectiveCreatedAt = new Date(Date.now() + i * 1000);
    const chain = validateNewFuelLogOdometer(
      chainPoints.map((c) => ({
        date: c.date,
        odometer_reading: c.odometer_reading,
        created_at: c.created_at,
      })),
      newDate,
      p.odometer_reading,
      prospectiveCreatedAt,
    );
    if (!chain.ok) {
      res.status(400).json({ error: `Row ${i + 1}: ${chain.error}` });
      return;
    }
    const doc = await FuelLog.create({
      user_id: v.user_id,
      vehicle_id: v._id,
      date: newDate,
      odometer_reading: p.odometer_reading,
      fuel_quantity_liters: p.fuel_quantity_liters,
      energy_unit: p.energy_unit,
      cost: p.cost,
      fuel_station: p.fuel_station ?? null,
    });
    const fresh = await FuelLog.findById(doc._id).lean();
    if (fresh) created.push(toFuelLogJson(fresh));
    chainPoints.push({
      date: newDate,
      odometer_reading: p.odometer_reading,
      created_at: prospectiveCreatedAt,
      isNew: true,
    });
  }

  res.status(201).json({ imported: created.length, logs: created });
});

export default router;
