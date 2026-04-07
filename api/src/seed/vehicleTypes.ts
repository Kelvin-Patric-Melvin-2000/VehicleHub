import { VehicleType } from "../models/VehicleType.js";

export const VEHICLE_TYPE_SEEDS = [
  { slug: "car", label: "Car", sort_order: 0 },
  { slug: "motorcycle", label: "Motorcycle", sort_order: 1 },
  { slug: "scooter", label: "Scooter", sort_order: 2 },
  { slug: "bike", label: "Bike", sort_order: 3 },
] as const;

export async function seedVehicleTypes(): Promise<void> {
  for (const row of VEHICLE_TYPE_SEEDS) {
    await VehicleType.updateOne(
      { slug: row.slug },
      { $set: { label: row.label, sort_order: row.sort_order } },
      { upsert: true },
    );
  }
}
