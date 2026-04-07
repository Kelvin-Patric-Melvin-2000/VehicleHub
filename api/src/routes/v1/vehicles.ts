import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../../middleware/requireAuth.js";
import { Vehicle } from "../../models/Vehicle.js";
import { findOwnedVehicle } from "../../lib/ownership.js";
import { getDefaultVehicleTypeSlug, isKnownVehicleTypeSlug } from "../../lib/vehicleTypeHelpers.js";
import { toVehicleJson } from "../../lib/serialize.js";

const router = Router();
router.use(requireAuth);

router.get("/vehicles", async (req, res) => {
  const list = await Vehicle.find({ user_id: req.userId }).sort({ created_at: -1 }).lean();
  res.json(list.map((d) => toVehicleJson(d)));
});

router.post("/vehicles", async (req, res) => {
  try {
    const b = req.body ?? {};
    let typeSlug: string;
    if (typeof b.type === "string" && b.type.trim()) {
      const t = b.type.trim();
      if (!(await isKnownVehicleTypeSlug(t))) {
        res.status(400).json({ error: "Unknown vehicle type" });
        return;
      }
      typeSlug = t;
    } else {
      typeSlug = await getDefaultVehicleTypeSlug();
    }
    const doc = await Vehicle.create({
      user_id: req.userId,
      name: String(b.name ?? ""),
      type: typeSlug,
      make: b.make ?? null,
      model: b.model ?? null,
      year: b.year != null ? Number(b.year) : null,
      registration_number: b.registration_number ?? null,
      current_mileage: b.current_mileage != null ? Number(b.current_mileage) : 0,
      photo_url: b.photo_url ?? null,
    });
    const fresh = await Vehicle.findById(doc._id).lean();
    if (!fresh) {
      res.status(500).json({ error: "Failed to load vehicle" });
      return;
    }
    res.status(201).json(toVehicleJson(fresh));
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Invalid vehicle data" });
  }
});

router.get("/vehicles/:vehicleId", async (req, res) => {
  const v = await findOwnedVehicle(req.userId!, req.params.vehicleId);
  if (!v) {
    res.status(req.params.vehicleId && mongoose.Types.ObjectId.isValid(req.params.vehicleId) ? 404 : 400).json({
      error: "Not found",
    });
    return;
  }
  const lean = v.toObject();
  res.json(toVehicleJson(lean));
});

router.patch("/vehicles/:vehicleId", async (req, res) => {
  const b = req.body ?? {};
  const $set: Record<string, unknown> = {};
  if ("name" in b) $set.name = String(b.name ?? "");
  if ("type" in b) {
    const t = typeof b.type === "string" ? b.type.trim() : "";
    if (!t) {
      $set.type = await getDefaultVehicleTypeSlug();
    } else if (!(await isKnownVehicleTypeSlug(t))) {
      res.status(400).json({ error: "Unknown vehicle type" });
      return;
    } else {
      $set.type = t;
    }
  }
  if ("make" in b) $set.make = b.make ?? null;
  if ("model" in b) $set.model = b.model ?? null;
  if ("year" in b) $set.year = b.year != null ? Number(b.year) : null;
  if ("registration_number" in b) $set.registration_number = b.registration_number ?? null;
  if ("current_mileage" in b) $set.current_mileage = b.current_mileage != null ? Number(b.current_mileage) : 0;
  if ("photo_url" in b) $set.photo_url = b.photo_url ?? null;

  if (Object.keys($set).length === 0) {
    const existing = await Vehicle.findOne({ _id: req.params.vehicleId, user_id: req.userId }).lean();
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(toVehicleJson(existing));
    return;
  }

  const updated = await Vehicle.findOneAndUpdate(
    { _id: req.params.vehicleId, user_id: req.userId },
    { $set },
    { new: true },
  ).lean();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(toVehicleJson(updated));
});

router.delete("/vehicles/:vehicleId", async (req, res) => {
  const v = await findOwnedVehicle(req.userId!, req.params.vehicleId);
  if (!v) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await v.deleteOne();
  res.status(204).end();
});

export default router;
