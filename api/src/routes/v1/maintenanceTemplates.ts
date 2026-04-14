import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { MaintenanceTemplate } from "../../models/MaintenanceTemplate.js";

const router = Router();
router.use(requireAuth);

router.get("/maintenance-templates", async (req, res) => {
  const vehicleType = typeof req.query.vehicleType === "string" ? req.query.vehicleType : undefined;
  const filter: Record<string, unknown> = {};
  if (vehicleType) {
    filter.$or = [{ vehicle_type: null }, { vehicle_type: vehicleType }];
  }
  const list = await MaintenanceTemplate.find(filter).sort({ sort_order: 1, label: 1 }).lean();
  res.json(
    list.map((t) => ({
      id: t._id.toString(),
      label: t.label,
      service_type: t.service_type,
      interval_km: t.interval_km ?? null,
      interval_months: t.interval_months ?? null,
      vehicle_type: t.vehicle_type ?? null,
      sort_order: t.sort_order,
    })),
  );
});

export default router;
