import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../../middleware/requireAuth.js";
import { Vehicle } from "../../models/Vehicle.js";
import { User } from "../../models/User.js";
import { VehicleShare } from "../../models/VehicleShare.js";
import { findAccessibleVehicle, findOwnedVehicle } from "../../lib/ownership.js";
import { getDefaultVehicleTypeSlug, isKnownVehicleTypeSlug } from "../../lib/vehicleTypeHelpers.js";
import { toVehicleJson } from "../../lib/serialize.js";

const router = Router();
router.use(requireAuth);

router.get("/vehicles", async (req, res) => {
  const uid = req.userId!;
  const owned = await Vehicle.find({ user_id: uid }).sort({ created_at: -1 }).lean();
  const shares = await VehicleShare.find({ shared_with_user_id: uid }).lean();
  const sharedIds = shares.map((s) => s.vehicle_id);
  const sharedVehicles =
    sharedIds.length > 0
      ? await Vehicle.find({ _id: { $in: sharedIds } }).lean()
      : [];
  const roleByVid = new Map(shares.map((s) => [s.vehicle_id.toString(), s.role as "view" | "edit"]));
  const ownedIds = new Set(owned.map((o) => o._id.toString()));
  const sharedPart = sharedVehicles
    .filter((sv) => !ownedIds.has(sv._id.toString()))
    .map((d) => toVehicleJson(d, roleByVid.get(d._id.toString()) === "edit" ? "edit" : "view"));
  res.json([...owned.map((d) => toVehicleJson(d, "owner")), ...sharedPart]);
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
    res.status(201).json(toVehicleJson(fresh, "owner"));
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Invalid vehicle data" });
  }
});

router.get("/vehicles/:vehicleId/shares", async (req, res) => {
  const v = await findOwnedVehicle(req.userId!, req.params.vehicleId);
  if (!v) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const list = await VehicleShare.find({ vehicle_id: v._id })
    .populate("shared_with_user_id", "email display_name")
    .lean();
  res.json(
    list.map((s) => ({
      id: s._id.toString(),
      role: s.role,
      user: s.shared_with_user_id && typeof s.shared_with_user_id === "object"
        ? {
            id: (s.shared_with_user_id as { _id: mongoose.Types.ObjectId })._id.toString(),
            email: (s.shared_with_user_id as { email?: string }).email,
            display_name: (s.shared_with_user_id as { display_name?: string | null }).display_name ?? null,
          }
        : null,
    })),
  );
});

router.post("/vehicles/:vehicleId/shares", async (req, res) => {
  const v = await findOwnedVehicle(req.userId!, req.params.vehicleId);
  if (!v) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const b = req.body ?? {};
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const role = b.role === "edit" ? "edit" : "view";
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  const target = await User.findOne({ email });
  if (!target) {
    res.status(404).json({ error: "No user with that email" });
    return;
  }
  if (target._id.equals(v.user_id)) {
    res.status(400).json({ error: "Cannot share with yourself" });
    return;
  }
  const doc = await VehicleShare.findOneAndUpdate(
    { vehicle_id: v._id, shared_with_user_id: target._id },
    {
      $set: {
        owner_user_id: v.user_id,
        vehicle_id: v._id,
        shared_with_user_id: target._id,
        role,
      },
    },
    { upsert: true, new: true },
  );
  res.status(201).json({
    id: doc!._id.toString(),
    role: doc!.role,
    user: { id: target._id.toString(), email: target.email, display_name: target.display_name },
  });
});

router.delete("/vehicles/:vehicleId/shares/:shareId", async (req, res) => {
  const v = await findOwnedVehicle(req.userId!, req.params.vehicleId);
  if (!v) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.shareId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const r = await VehicleShare.deleteOne({ _id: req.params.shareId, vehicle_id: v._id });
  if (r.deletedCount === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});

router.get("/vehicles/:vehicleId", async (req, res) => {
  const a = await findAccessibleVehicle(req.userId!, req.params.vehicleId);
  if (!a) {
    res.status(req.params.vehicleId && mongoose.Types.ObjectId.isValid(req.params.vehicleId) ? 404 : 400).json({
      error: "Not found",
    });
    return;
  }
  const lean = a.vehicle.toObject();
  const access: "owner" | "view" | "edit" = a.role === "owner" ? "owner" : a.role === "edit" ? "edit" : "view";
  res.json(toVehicleJson(lean, access));
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
  await VehicleShare.deleteMany({ vehicle_id: v._id });
  await v.deleteOne();
  res.status(204).end();
});

export default router;
