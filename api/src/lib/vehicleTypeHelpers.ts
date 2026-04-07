import { VehicleType } from "../models/VehicleType.js";

export async function getDefaultVehicleTypeSlug(): Promise<string> {
  const first = await VehicleType.findOne().sort({ sort_order: 1 }).select("slug").lean();
  return first?.slug ?? "motorcycle";
}

export async function isKnownVehicleTypeSlug(slug: string): Promise<boolean> {
  const n = await VehicleType.countDocuments({ slug });
  return n > 0;
}
