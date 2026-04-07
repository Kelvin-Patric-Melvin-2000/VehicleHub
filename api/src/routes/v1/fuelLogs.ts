import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../../middleware/requireAuth.js";
import { FuelLog } from "../../models/FuelLog.js";
import { findOwnedVehicle } from "../../lib/ownership.js";
import { toFuelLogJson } from "../../lib/serialize.js";

const router = Router();
router.use(requireAuth);

router.get("/vehicles/:vehicleId/fuel-logs", async (req, res) => {
  const v = await findOwnedVehicle(req.userId!, req.params.vehicleId);
  if (!v) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const list = await FuelLog.find({ vehicle_id: v._id, user_id: req.userId })
    .sort({ date: -1 })
    .lean();
  res.json(list.map((d) => toFuelLogJson(d)));
});

router.post("/vehicles/:vehicleId/fuel-logs", async (req, res) => {
  const v = await findOwnedVehicle(req.userId!, req.params.vehicleId);
  if (!v) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const b = req.body ?? {};
  try {
    const doc = await FuelLog.create({
      user_id: req.userId,
      vehicle_id: v._id,
      date: b.date ? new Date(String(b.date)) : new Date(),
      odometer_reading: Number(b.odometer_reading),
      fuel_quantity_liters: Number(b.fuel_quantity_liters),
      cost: Number(b.cost),
      fuel_station: b.fuel_station ?? null,
    });
    const fresh = await FuelLog.findById(doc._id).lean();
    if (!fresh) {
      res.status(500).json({ error: "Failed to load fuel log" });
      return;
    }
    res.status(201).json(toFuelLogJson(fresh));
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
  const r = await FuelLog.deleteOne({ _id: req.params.fuelLogId, user_id: req.userId });
  if (r.deletedCount === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});

export default router;
