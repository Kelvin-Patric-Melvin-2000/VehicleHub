import { Router } from "express";
import { VehicleType } from "../../models/VehicleType.js";

const router = Router();

router.get("/vehicle-types", async (_req, res) => {
  const list = await VehicleType.find({}).sort({ sort_order: 1 }).lean();
  res.json(
    list.map((d) => ({
      slug: d.slug,
      label: d.label,
      sort_order: d.sort_order,
    })),
  );
});

export default router;
