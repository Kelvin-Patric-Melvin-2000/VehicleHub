import mongoose from "mongoose";
import { Vehicle } from "../models/Vehicle.js";
import { VehicleShare } from "../models/VehicleShare.js";

export type VehicleAccessRole = "owner" | "view" | "edit";

export async function findAccessibleVehicle(userId: string, vehicleId: string) {
  if (!mongoose.Types.ObjectId.isValid(vehicleId)) return null;
  const v = await Vehicle.findById(vehicleId);
  if (!v) return null;
  if (v.user_id.toString() === userId) {
    return { vehicle: v, role: "owner" };
  }
  const share = await VehicleShare.findOne({
    vehicle_id: v._id,
    shared_with_user_id: userId,
  }).lean();
  if (!share) return null;
  return { vehicle: v, role: share.role === "edit" ? "edit" : "view" };
}

/** Owner only (manage vehicle, sharing, delete vehicle). */
export async function findOwnedVehicle(userId: string, vehicleId: string): Promise<InstanceType<typeof Vehicle> | null> {
  const a = await findAccessibleVehicle(userId, vehicleId);
  if (!a || a.role !== "owner") return null;
  return a.vehicle;
}

/** Owner or edit share — mutations on logs, services, documents. */
export async function findEditableVehicle(userId: string, vehicleId: string): Promise<InstanceType<typeof Vehicle> | null> {
  const a = await findAccessibleVehicle(userId, vehicleId);
  if (!a) return null;
  if (a.role === "owner" || a.role === "edit") return a.vehicle;
  return null;
}

export async function getAccessibleVehicleIds(userId: string): Promise<{
  ids: mongoose.Types.ObjectId[];
  ownedIds: mongoose.Types.ObjectId[];
}> {
  const owned = await Vehicle.find({ user_id: userId }).select("_id").lean();
  const ownedIds = owned.map((x) => x._id as mongoose.Types.ObjectId);
  const shares = await VehicleShare.find({ shared_with_user_id: userId }).select("vehicle_id").lean();
  const sharedIds = shares.map((s) => s.vehicle_id as mongoose.Types.ObjectId);
  const set = new Map<string, mongoose.Types.ObjectId>();
  for (const id of [...ownedIds, ...sharedIds]) {
    set.set(id.toString(), id);
  }
  return { ids: Array.from(set.values()), ownedIds };
}
