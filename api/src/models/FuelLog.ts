import mongoose from "mongoose";

const fuelLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    date: { type: Date, required: true },
    odometer_reading: { type: Number, required: true },
    fuel_quantity_liters: { type: Number, required: true },
    cost: { type: Number, required: true },
    fuel_station: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } },
);

export const FuelLog = mongoose.model("FuelLog", fuelLogSchema, "fuel_logs");
