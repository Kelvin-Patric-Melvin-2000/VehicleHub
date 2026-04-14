import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { FuelPriceCache } from "../../models/FuelPriceCache.js";

const router = Router();
router.use(requireAuth);

/** Cached indicative price (optional external API integration). */
router.get("/fuel-price/indicative", async (_req, res) => {
  const row = await FuelPriceCache.findOne({ key: "default" }).lean();
  const updated =
    row && "updated_at" in row && row.updated_at
      ? new Date(row.updated_at as Date).toISOString()
      : null;
  res.json({
    pricePerLiter: row ? row.price_per_liter : null,
    region: row?.region ?? "default",
    source: row?.source ?? null,
    updatedAt: updated,
  });
});

export default router;
