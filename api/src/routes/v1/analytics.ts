import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { FuelLog } from "../../models/FuelLog.js";
import { findOwnedVehicle } from "../../lib/ownership.js";

const router = Router();
router.use(requireAuth);

router.get("/vehicles/:vehicleId/analytics/fuel", async (req, res) => {
  const v = await findOwnedVehicle(req.userId!, req.params.vehicleId);
  if (!v) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const logs = await FuelLog.find({ vehicle_id: v._id, user_id: req.userId })
    .sort({ date: 1 })
    .lean();

  const sorted = logs.map((l) => ({
    date: l.date,
    odometer_reading: l.odometer_reading,
    fuel_quantity_liters: l.fuel_quantity_liters,
    cost: l.cost,
  }));

  const economyPoints: { kmPerL: number; costPerKm: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const log = sorted[i]!;
    const dist = log.odometer_reading - prev.odometer_reading;
    if (dist <= 0) continue;
    economyPoints.push({
      kmPerL: Number((dist / log.fuel_quantity_liters).toFixed(1)),
      costPerKm: Number((log.cost / dist).toFixed(2)),
    });
  }

  const monthlyMap = new Map<string, number>();
  for (const log of sorted) {
    const d = new Date(log.date);
    const key = `${d.toLocaleString("en", { month: "short" })} ${d.getFullYear()}`;
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + log.cost);
  }
  const monthly = Array.from(monthlyMap.entries()).map(([month, cost]) => ({
    month,
    cost: Math.round(cost),
  }));

  const totalFuel = sorted.reduce((s, l) => s + l.fuel_quantity_liters, 0);
  const totalCost = sorted.reduce((s, l) => s + l.cost, 0);
  const avgEconomy =
    economyPoints.length > 0
      ? (economyPoints.reduce((s, p) => s + p.kmPerL, 0) / economyPoints.length).toFixed(1)
      : null;
  const avgCostPerKm =
    economyPoints.length > 0
      ? (economyPoints.reduce((s, p) => s + p.costPerKm, 0) / economyPoints.length).toFixed(2)
      : null;

  res.json({
    fillCount: sorted.length,
    totalFuelLiters: totalFuel,
    totalCost,
    avgKmPerL: avgEconomy,
    avgCostPerKm,
    monthly,
    economySampleCount: economyPoints.length,
  });
});

export default router;
