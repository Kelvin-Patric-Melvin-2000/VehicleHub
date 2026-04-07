import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import mongoose from "mongoose";
import { requireAuth } from "../../middleware/requireAuth.js";
import { DocumentModel } from "../../models/Document.js";
import { findOwnedVehicle } from "../../lib/ownership.js";
import { toDocumentJson } from "../../lib/serialize.js";

const uploadsRoot = path.join(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dir = path.join(uploadsRoot, req.userId!);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

const router = Router();
router.use(requireAuth);

router.get("/documents", async (req, res) => {
  const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : undefined;
  const filter: Record<string, unknown> = { user_id: req.userId };
  if (vehicleId) {
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      res.status(400).json({ error: "Invalid vehicleId" });
      return;
    }
    filter.vehicle_id = vehicleId;
  }
  const list = await DocumentModel.find(filter).populate("vehicle_id", "name").sort({ expiry_date: 1 }).lean();
  res.json(list.map((d) => toDocumentJson(d)));
});

router.post("/documents/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Missing file field" });
    return;
  }
  const rel = `/uploads/${req.userId}/${req.file.filename}`;
  const base =
    process.env.PUBLIC_API_URL ??
    `${req.protocol}://${req.get("host")}`;
  const url = `${base.replace(/\/$/, "")}${rel}`;
  res.status(201).json({ url });
});

router.post("/documents", async (req, res) => {
  const b = req.body ?? {};
  const vehicle_id = typeof b.vehicle_id === "string" ? b.vehicle_id : "";
  const v = await findOwnedVehicle(req.userId!, vehicle_id);
  if (!v) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }
  try {
    const doc = await DocumentModel.create({
      user_id: req.userId,
      vehicle_id: v._id,
      document_type: String(b.document_type ?? ""),
      document_number: b.document_number ?? null,
      issue_date: b.issue_date ? new Date(String(b.issue_date)) : null,
      expiry_date: b.expiry_date ? new Date(String(b.expiry_date)) : null,
      file_url: b.file_url ?? null,
    });
    const fresh = await DocumentModel.findById(doc._id).populate("vehicle_id", "name").lean();
    if (!fresh) {
      res.status(500).json({ error: "Failed to load document" });
      return;
    }
    res.status(201).json(toDocumentJson(fresh));
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Invalid document data" });
  }
});

router.delete("/documents/:documentId", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.documentId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const r = await DocumentModel.deleteOne({ _id: req.params.documentId, user_id: req.userId });
  if (r.deletedCount === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});

export default router;
