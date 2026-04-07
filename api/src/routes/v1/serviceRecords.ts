import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../../middleware/requireAuth.js";
import { ServiceRecord } from "../../models/ServiceRecord.js";
import { findOwnedVehicle } from "../../lib/ownership.js";
import { toServiceRecordJson } from "../../lib/serialize.js";

const router = Router();
router.use(requireAuth);

router.get("/service-records", async (req, res) => {
  const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : undefined;
  const filter: Record<string, unknown> = { user_id: req.userId };
  if (vehicleId) {
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      res.status(400).json({ error: "Invalid vehicleId" });
      return;
    }
    filter.vehicle_id = vehicleId;
  }

  let q = ServiceRecord.find(filter).populate("vehicle_id", "name");
  if (vehicleId) {
    q = q.sort({ date: -1 });
  } else {
    q = q.sort({ next_service_date: 1 });
  }
  const list = await q.lean();
  res.json(list.map((d) => toServiceRecordJson(d)));
});

router.post("/service-records", async (req, res) => {
  const b = req.body ?? {};
  const vehicle_id = typeof b.vehicle_id === "string" ? b.vehicle_id : "";
  const v = await findOwnedVehicle(req.userId!, vehicle_id);
  if (!v) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }
  try {
    const doc = await ServiceRecord.create({
      user_id: req.userId,
      vehicle_id: v._id,
      date: b.date ? new Date(String(b.date)) : new Date(),
      odometer: b.odometer != null ? Number(b.odometer) : null,
      service_type: String(b.service_type ?? ""),
      description: b.description ?? null,
      cost: b.cost != null ? Number(b.cost) : 0,
      next_service_date: b.next_service_date ? new Date(String(b.next_service_date)) : null,
      next_service_mileage: b.next_service_mileage != null ? Number(b.next_service_mileage) : null,
    });
    const fresh = await ServiceRecord.findById(doc._id).populate("vehicle_id", "name").lean();
    if (!fresh) {
      res.status(500).json({ error: "Failed to load service record" });
      return;
    }
    res.status(201).json(toServiceRecordJson(fresh));
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Invalid service record data" });
  }
});

router.delete("/service-records/:serviceRecordId", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.serviceRecordId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const r = await ServiceRecord.deleteOne({ _id: req.params.serviceRecordId, user_id: req.userId });
  if (r.deletedCount === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});

export default router;
