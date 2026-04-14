import mongoose from "mongoose";

const vehicleShareSchema = new mongoose.Schema(
  {
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    owner_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shared_with_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["view", "edit"], default: "view" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

vehicleShareSchema.index({ vehicle_id: 1, shared_with_user_id: 1 }, { unique: true });

export const VehicleShare = mongoose.model("VehicleShare", vehicleShareSchema, "vehicle_shares");
