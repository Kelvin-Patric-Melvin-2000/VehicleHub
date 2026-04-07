import mongoose from "mongoose";

const vehicleTypeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    sort_order: { type: Number, required: true, default: 0 },
  },
  { timestamps: false },
);

export const VehicleType = mongoose.model("VehicleType", vehicleTypeSchema, "vehicle_types");
