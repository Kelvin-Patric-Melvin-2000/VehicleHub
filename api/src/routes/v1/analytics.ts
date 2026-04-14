import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { FuelLog } from "../../models/FuelLog.js";
import { ServiceRecord } from "../../models/ServiceRecord.js";
import { DocumentModel } from "../../models/Document.js";
import { findAccessibleVehicle, getAccessibleVehicleIds } from "../../lib/ownership.js";

const router = Router();
router.use(requireAuth);

type LeanFuelLog = {
  date: Date;
  odometer_reading: number;
  fuel_quantity_liters: number;
  cost: number;
  energy_unit?: string;
  vehicle_id: unknown;
};

function unitOf(log: LeanFuelLog): "L" | "kWh" {
  return log.energy_unit === "kWh" ? "kWh" : "L";
}

function isLiquid(log: LeanFuelLog): boolean {
  return unitOf(log) !== "kWh";
}

function monthKey(d: Date): string {
  return `${d.toLocaleString("en", { month: "short" })} ${d.getFullYear()}`;
}

function isoMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function labelFromIsoMonth(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return iso;
  const d = new Date(y, m - 1, 1);
  return monthKey(d);
}

/** Fleet-wide attention counts, TCO by month, blended cost/km (liquid fills). */
router.get("/analytics/fleet/summary", async (req, res) => {
  const uid = req.userId!;
  const { ids: vehicleIds } = await getAccessibleVehicleIds(uid);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 30);

  const services = await ServiceRecord.find({ vehicle_id: { $in: vehicleIds } }).lean();
  let upcomingServicesCount = 0;
  const attentionVehicleIds = new Set<string>();
  for (const s of services) {
    if (!s.next_service_date) continue;
    const due = new Date(s.next_service_date);
    if (due <= horizon) {
      upcomingServicesCount += 1;
      attentionVehicleIds.add(String(s.vehicle_id));
    }
  }

  const documents = await DocumentModel.find({ vehicle_id: { $in: vehicleIds } }).lean();
  let expiringDocumentsCount = 0;
  let expiredDocumentsCount = 0;
  for (const doc of documents) {
    if (!doc.expiry_date) continue;
    const exp = new Date(doc.expiry_date);
    exp.setHours(0, 0, 0, 0);
    if (exp < today) {
      expiredDocumentsCount += 1;
      attentionVehicleIds.add(String(doc.vehicle_id));
    } else if (exp <= horizon) {
      expiringDocumentsCount += 1;
      attentionVehicleIds.add(String(doc.vehicle_id));
    }
  }

  const fuelLogs = (await FuelLog.find({ vehicle_id: { $in: vehicleIds } }).lean()) as LeanFuelLog[];
  const tcoMap = new Map<string, { fuel: number; service: number }>();
  for (const l of fuelLogs) {
    const key = isoMonthKey(new Date(l.date));
    const cur = tcoMap.get(key) ?? { fuel: 0, service: 0 };
    cur.fuel += Number(l.cost) || 0;
    tcoMap.set(key, cur);
  }
  for (const s of services) {
    const key = isoMonthKey(new Date(s.date));
    const cur = tcoMap.get(key) ?? { fuel: 0, service: 0 };
    cur.service += Number(s.cost) || 0;
    tcoMap.set(key, cur);
  }
  const tcoByMonth = Array.from(tcoMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iso, v]) => ({
      month: labelFromIsoMonth(iso),
      fuelCost: Math.round(v.fuel),
      serviceCost: Math.round(v.service),
      total: Math.round(v.fuel + v.service),
    }));

  const liquidLogs = fuelLogs.filter(isLiquid);
  const byVehicle = new Map<string, LeanFuelLog[]>();
  for (const log of liquidLogs) {
    const vid = String(log.vehicle_id);
    if (!byVehicle.has(vid)) byVehicle.set(vid, []);
    byVehicle.get(vid)!.push(log);
  }
  let totalDistKm = 0;
  let totalTripCost = 0;
  for (const vehLogs of byVehicle.values()) {
    vehLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (let i = 1; i < vehLogs.length; i++) {
      const prev = vehLogs[i - 1]!;
      const log = vehLogs[i]!;
      const dist = log.odometer_reading - prev.odometer_reading;
      if (dist <= 0) continue;
      const qty = log.fuel_quantity_liters;
      if (qty <= 0) continue;
      totalDistKm += dist;
      totalTripCost += log.cost;
    }
  }
  const fleetCostPerKm =
    totalDistKm > 0 ? (totalTripCost / totalDistKm).toFixed(2) : null;

  const totalFuelSpend = fuelLogs.reduce((s, l) => s + (Number(l.cost) || 0), 0);
  const totalServiceSpend = services.reduce((s, x) => s + (Number(x.cost) || 0), 0);

  res.json({
    upcomingServicesCount,
    expiringDocumentsCount,
    expiredDocumentsCount,
    attentionVehicleIds: Array.from(attentionVehicleIds),
    tcoByMonth,
    fleetCostPerKm,
    totalFuelSpend: Math.round(totalFuelSpend),
    totalServiceSpend: Math.round(totalServiceSpend),
    totalCostOfOwnership: Math.round(totalFuelSpend + totalServiceSpend),
  });
});

/** All fuel logs for the user. Fleet liquid metrics use L logs only; EV has separate counters. */
router.get("/analytics/fleet/fuel", async (req, res) => {
  const { ids: vehicleIds } = await getAccessibleVehicleIds(req.userId!);
  const logs = (await FuelLog.find({ vehicle_id: { $in: vehicleIds } })
    .sort({ date: 1 })
    .lean()) as LeanFuelLog[];

  const liquidLogs = logs.filter(isLiquid);
  const electricLogs = logs.filter((l) => !isLiquid(l));

  const byVehicle = new Map<string, LeanFuelLog[]>();
  for (const log of liquidLogs) {
    const vid = String(log.vehicle_id);
    if (!byVehicle.has(vid)) byVehicle.set(vid, []);
    byVehicle.get(vid)!.push(log);
  }

  const economyPoints: { kmPerL: number }[] = [];
  for (const vehLogs of byVehicle.values()) {
    vehLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (let i = 1; i < vehLogs.length; i++) {
      const prev = vehLogs[i - 1]!;
      const log = vehLogs[i]!;
      const dist = log.odometer_reading - prev.odometer_reading;
      if (dist <= 0) continue;
      const qty = log.fuel_quantity_liters;
      if (qty <= 0) continue;
      economyPoints.push({
        kmPerL: Number((dist / qty).toFixed(1)),
      });
    }
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let thisMonthFuelCost = 0;
  let thisMonthLiquidFuelCost = 0;
  let thisMonthEvCost = 0;
  let thisMonthKWh = 0;

  for (const log of logs) {
    const d = new Date(log.date);
    if (d >= startOfMonth) {
      thisMonthFuelCost += log.cost;
      if (isLiquid(log)) {
        thisMonthLiquidFuelCost += log.cost;
      } else {
        thisMonthEvCost += log.cost;
        thisMonthKWh += log.fuel_quantity_liters;
      }
    }
  }

  const liquidPriceSamples: number[] = [];
  for (const log of liquidLogs) {
    const qty = log.fuel_quantity_liters;
    if (qty > 0) liquidPriceSamples.push(log.cost / qty);
  }
  const avgPricePerLiter =
    liquidPriceSamples.length > 0
      ? (liquidPriceSamples.reduce((s, p) => s + p, 0) / liquidPriceSamples.length).toFixed(2)
      : null;

  const avgKmPerL =
    economyPoints.length > 0
      ? (economyPoints.reduce((s, p) => s + p.kmPerL, 0) / economyPoints.length).toFixed(1)
      : null;

  res.json({
    fillCount: logs.length,
    fillCountLiquid: liquidLogs.length,
    fillCountElectric: electricLogs.length,
    thisMonthFuelCost: Math.round(thisMonthFuelCost),
    thisMonthLiquidFuelCost: Math.round(thisMonthLiquidFuelCost),
    thisMonthEvCost: Math.round(thisMonthEvCost),
    thisMonthKWhCharged: Number(thisMonthKWh.toFixed(2)),
    avgKmPerL,
    avgPricePerLiter,
    economySampleCount: economyPoints.length,
  });
});

router.get("/vehicles/:vehicleId/analytics/fuel", async (req, res) => {
  const v = await findAccessibleVehicle(req.userId!, req.params.vehicleId);
  if (!v) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const logs = (await FuelLog.find({ vehicle_id: v.vehicle._id })
    .sort({ date: 1 })
    .lean()) as LeanFuelLog[];

  if (logs.length === 0) {
    res.json({
      analyticsMode: "liquid" as const,
      fillCount: 0,
      totalQuantity: 0,
      totalCost: 0,
      avgEconomy: null,
      avgCostPerKm: null,
      avgPricePerUnit: null,
      monthly: [],
      monthlyAvgPrice: [],
      priceTrend: [],
      economyTrend: [],
      economySampleCount: 0,
    });
    return;
  }

  const mode = unitOf(logs[0]!) === "kWh" ? "electric" : "liquid";

  const sorted = logs.map((l) => ({
    date: l.date,
    odometer_reading: l.odometer_reading,
    fuel_quantity_liters: l.fuel_quantity_liters,
    cost: l.cost,
  }));

  const economyTrend: { date: string; economy: number }[] = [];
  const economyForAvg: number[] = [];
  const costPerKmForAvg: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const log = sorted[i]!;
    const dist = log.odometer_reading - prev.odometer_reading;
    if (dist <= 0) continue;
    const qty = log.fuel_quantity_liters;
    if (qty <= 0) continue;
    const economy = dist / qty;
    economyTrend.push({
      date: new Date(log.date).toISOString(),
      economy: Number(economy.toFixed(1)),
    });
    economyForAvg.push(economy);
    costPerKmForAvg.push(log.cost / dist);
  }

  const monthlyMap = new Map<string, number>();
  for (const log of sorted) {
    const d = new Date(log.date);
    const key = monthKey(d);
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + log.cost);
  }
  const monthly = Array.from(monthlyMap.entries()).map(([month, cost]) => ({
    month,
    cost: Math.round(cost),
  }));

  const priceTrend: { date: string; pricePerUnit: number }[] = [];
  const monthlyPriceBuckets = new Map<string, number[]>();
  for (const log of sorted) {
    const qty = log.fuel_quantity_liters;
    if (qty <= 0) continue;
    const ppu = log.cost / qty;
    const iso = new Date(log.date).toISOString();
    priceTrend.push({ date: iso, pricePerUnit: Number(ppu.toFixed(2)) });

    const mk = monthKey(new Date(log.date));
    if (!monthlyPriceBuckets.has(mk)) monthlyPriceBuckets.set(mk, []);
    monthlyPriceBuckets.get(mk)!.push(ppu);
  }

  const monthlyAvgPrice = Array.from(monthlyPriceBuckets.entries()).map(([month, samples]) => ({
    month,
    avgPricePerUnit: Number((samples.reduce((s, x) => s + x, 0) / samples.length).toFixed(2)),
  }));

  const totalQuantity = sorted.reduce((s, l) => s + l.fuel_quantity_liters, 0);
  const totalCost = sorted.reduce((s, l) => s + l.cost, 0);

  const avgEconomy =
    economyForAvg.length > 0
      ? (economyForAvg.reduce((s, x) => s + x, 0) / economyForAvg.length).toFixed(1)
      : null;
  const avgCostPerKm =
    costPerKmForAvg.length > 0
      ? (costPerKmForAvg.reduce((s, x) => s + x, 0) / costPerKmForAvg.length).toFixed(2)
      : null;

  const priceSamples = sorted.filter((l) => l.fuel_quantity_liters > 0).map((l) => l.cost / l.fuel_quantity_liters);
  const avgPricePerUnit =
    priceSamples.length > 0
      ? (priceSamples.reduce((s, x) => s + x, 0) / priceSamples.length).toFixed(2)
      : null;

  res.json({
    analyticsMode: mode,
    fillCount: sorted.length,
    totalQuantity,
    totalCost,
    avgEconomy,
    avgCostPerKm,
    avgPricePerUnit,
    monthly,
    monthlyAvgPrice,
    priceTrend,
    economyTrend,
    economySampleCount: economyTrend.length,
  });
});

export default router;
