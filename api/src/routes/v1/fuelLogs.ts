import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../../middleware/requireAuth.js";
import { FuelLog } from "../../models/FuelLog.js";
import { findAccessibleVehicle, findEditableVehicle } from "../../lib/ownership.js";
import { validateNewFuelLogOdometer } from "../../lib/fuelLogOdometer.js";
import { toFuelLogJson } from "../../lib/serialize.js";

const router = Router();
router.use(requireAuth);

function normalizeEnergyUnit(raw: unknown): "L" | "kWh" {
  return raw === "kWh" ? "kWh" : "L";
}

router.get("/vehicles/:vehicleId/fuel-logs", async (req, res) => {
  const acc = await findAccessibleVehicle(req.userId!, req.params.vehicleId);
  if (!acc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const list = await FuelLog.find({ vehicle_id: acc.vehicle._id })
    .sort({ date: -1 })
    .lean();
  res.json(list.map((d) => toFuelLogJson(d)));
});

router.post("/vehicles/:vehicleId/fuel-logs", async (req, res) => {
  const v = await findEditableVehicle(req.userId!, req.params.vehicleId);
  if (!v) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const ownerId = v.user_id;
  const b = req.body ?? {};
  const energy_unit = normalizeEnergyUnit(b.energy_unit);
  const existingUnit = await FuelLog.findOne({ vehicle_id: v._id })
    .sort({ date: 1 })
    .select("energy_unit")
    .lean();
  if (existingUnit && normalizeEnergyUnit((existingUnit as { energy_unit?: string }).energy_unit) !== energy_unit) {
    res.status(400).json({ error: "Energy unit must match existing logs for this vehicle" });
    return;
  }

  const newDate = b.date ? new Date(String(b.date)) : new Date();
  const newOdo = Number(b.odometer_reading);
  const existingLogs = await FuelLog.find({ vehicle_id: v._id })
    .sort({ date: 1, created_at: 1 })
    .select("date odometer_reading created_at")
    .lean();
  const prospectiveCreatedAt = new Date();
  const chain = validateNewFuelLogOdometer(
    existingLogs.map((e) => ({
      date: new Date(e.date as Date),
      odometer_reading: Number(e.odometer_reading),
      created_at: new Date((e as { created_at?: Date }).created_at ?? e.date),
    })),
    newDate,
    newOdo,
    prospectiveCreatedAt,
  );
  if (!chain.ok) {
    res.status(400).json({ error: chain.error });
    return;
  }

  try {
    const doc = await FuelLog.create({
      user_id: ownerId,
      vehicle_id: v._id,
      date: newDate,
      odometer_reading: newOdo,
      fuel_quantity_liters: Number(b.fuel_quantity_liters),
      energy_unit,
      cost: Number(b.cost),
      fuel_station: b.fuel_station ?? null,
    });
    const fresh = await FuelLog.findById(doc._id).lean();
    if (!fresh) {
      res.status(500).json({ error: "Failed to load fuel log" });
      return;
    }
    const payload = toFuelLogJson(fresh) as Record<string, unknown>;
    if (chain.warnings.length > 0) {
      payload.warnings = chain.warnings;
    }
    res.status(201).json(payload);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Invalid fuel log data" });
  }
});

router.delete("/fuel-logs/:fuelLogId", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.fuelLogId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const log = await FuelLog.findById(req.params.fuelLogId).lean();
  if (!log) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const veh = await findEditableVehicle(req.userId!, log.vehicle_id.toString());
  if (!veh) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await FuelLog.deleteOne({ _id: log._id });
  res.status(204).end();
});

export default router;
