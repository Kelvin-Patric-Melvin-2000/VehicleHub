import mongoose from "mongoose";
import { Vehicle } from "../models/Vehicle.js";

export async function findOwnedVehicle(userId: string, vehicleId: string) {
  if (!mongoose.Types.ObjectId.isValid(vehicleId)) return null;
  return Vehicle.findOne({ _id: vehicleId, user_id: userId });
}
