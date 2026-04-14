import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../../middleware/requireAuth.js";
import { FuelLog } from "../../models/FuelLog.js";
import { ServiceRecord } from "../../models/ServiceRecord.js";
import { DocumentModel } from "../../models/Document.js";
import { Vehicle } from "../../models/Vehicle.js";
import { findAccessibleVehicle, getAccessibleVehicleIds } from "../../lib/ownership.js";
import { toCsvRow } from "../../lib/csv.js";

const router = Router();
router.use(requireAuth);

function parseRange(req: { query: Record<string, unknown> }): { from: Date | null; to: Date | null } {
  const fromQ = typeof req.query.from === "string" ? req.query.from : undefined;
  const toQ = typeof req.query.to === "string" ? req.query.to : undefined;
  const from = fromQ ? new Date(fromQ) : null;
  const to = toQ ? new Date(toQ) : null;
  if (to) to.setHours(23, 59, 59, 999);
  return { from: from && !Number.isNaN(from.getTime()) ? from : null, to: to && !Number.isNaN(to.getTime()) ? to : null };
}

router.get("/exports/fuel-logs.csv", async (req, res) => {
  const uid = req.userId!;
  const { ids } = await getAccessibleVehicleIds(uid);
  const { from, to } = parseRange(req);
  const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : undefined;
  const filter: Record<string, unknown> = { vehicle_id: { $in: ids } };
  if (vehicleId) {
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      res.status(400).send("Invalid vehicleId");
      return;
    }
    const v = await findAccessibleVehicle(uid, vehicleId);
    if (!v) {
      res.status(404).send("Vehicle not found");
      return;
    }
    filter.vehicle_id = v.vehicle._id;
  }
  if (from || to) {
    filter.date = {};
    if (from) (filter.date as Record<string, Date>).$gte = from;
    if (to) (filter.date as Record<string, Date>).$lte = to;
  }
  const logs = await FuelLog.find(filter).sort({ date: 1 }).populate("vehicle_id", "name").lean();
  const lines = [
    toCsvRow([
      "date",
      "vehicle_name",
      "odometer_km",
      "quantity",
      "unit",
      "cost",
      "station",
    ]),
  ];
  for (const row of logs) {
    const vname =
      row.vehicle_id && typeof row.vehicle_id === "object" && "name" in row.vehicle_id
        ? String((row.vehicle_id as { name: string }).name)
        : "";
    lines.push(
      toCsvRow([
        new Date(row.date as Date).toISOString().slice(0, 10),
        vname,
        row.odometer_reading,
        row.fuel_quantity_liters,
        row.energy_unit ?? "L",
        row.cost,
        row.fuel_station ?? "",
      ]),
    );
  }
  const csv = lines.join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="fuel-logs.csv"');
  res.send("\uFEFF" + csv);
});

router.get("/exports/service-records.csv", async (req, res) => {
  const uid = req.userId!;
  const { ids } = await getAccessibleVehicleIds(uid);
  const { from, to } = parseRange(req);
  const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : undefined;
  const filter: Record<string, unknown> = { vehicle_id: { $in: ids } };
  if (vehicleId) {
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      res.status(400).send("Invalid vehicleId");
      return;
    }
    const v = await findAccessibleVehicle(uid, vehicleId);
    if (!v) {
      res.status(404).send("Vehicle not found");
      return;
    }
    filter.vehicle_id = v.vehicle._id;
  }
  if (from || to) {
    filter.date = {};
    if (from) (filter.date as Record<string, Date>).$gte = from;
    if (to) (filter.date as Record<string, Date>).$lte = to;
  }
  const rows = await ServiceRecord.find(filter).sort({ date: -1 }).populate("vehicle_id", "name").lean();
  const lines = [
    toCsvRow([
      "date",
      "vehicle_name",
      "service_type",
      "odometer_km",
      "cost",
      "next_service_date",
      "next_service_km",
      "description",
    ]),
  ];
  for (const row of rows) {
    const vname =
      row.vehicle_id && typeof row.vehicle_id === "object" && "name" in row.vehicle_id
        ? String((row.vehicle_id as { name: string }).name)
        : "";
    lines.push(
      toCsvRow([
        new Date(row.date as Date).toISOString().slice(0, 10),
        vname,
        row.service_type,
        row.odometer ?? "",
        row.cost,
        row.next_service_date ? new Date(row.next_service_date as Date).toISOString().slice(0, 10) : "",
        row.next_service_mileage ?? "",
        row.description ?? "",
      ]),
    );
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="service-records.csv"');
  res.send("\uFEFF" + lines.join("\r\n"));
});

router.get("/exports/documents.csv", async (req, res) => {
  const uid = req.userId!;
  const { ids } = await getAccessibleVehicleIds(uid);
  const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : undefined;
  const filter: Record<string, unknown> = { vehicle_id: { $in: ids } };
  if (vehicleId) {
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      res.status(400).send("Invalid vehicleId");
      return;
    }
    const v = await findAccessibleVehicle(uid, vehicleId);
    if (!v) {
      res.status(404).send("Vehicle not found");
      return;
    }
    filter.vehicle_id = v.vehicle._id;
  }
  const rows = await DocumentModel.find(filter).sort({ expiry_date: 1 }).populate("vehicle_id", "name").lean();
  const lines = [
    toCsvRow([
      "document_type",
      "vehicle_name",
      "document_number",
      "issue_date",
      "expiry_date",
      "file_url",
    ]),
  ];
  for (const row of rows) {
    const vname =
      row.vehicle_id && typeof row.vehicle_id === "object" && "name" in row.vehicle_id
        ? String((row.vehicle_id as { name: string }).name)
        : "";
    lines.push(
      toCsvRow([
        row.document_type,
        vname,
        row.document_number ?? "",
        row.issue_date ? new Date(row.issue_date as Date).toISOString().slice(0, 10) : "",
        row.expiry_date ? new Date(row.expiry_date as Date).toISOString().slice(0, 10) : "",
        row.file_url ?? "",
      ]),
    );
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="documents.csv"');
  res.send("\uFEFF" + lines.join("\r\n"));
});

router.get("/exports/vehicles.csv", async (req, res) => {
  const uid = req.userId!;
  const { ids } = await getAccessibleVehicleIds(uid);
  const list = await Vehicle.find({ _id: { $in: ids } }).sort({ name: 1 }).lean();
  const lines = [
    toCsvRow(["name", "type", "make", "model", "year", "registration", "current_mileage_km"]),
  ];
  for (const v of list) {
    lines.push(
      toCsvRow([
        v.name,
        v.type,
        v.make ?? "",
        v.model ?? "",
        v.year ?? "",
        v.registration_number ?? "",
        v.current_mileage,
      ]),
    );
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="vehicles.csv"');
  res.send("\uFEFF" + lines.join("\r\n"));
});

export default router;
