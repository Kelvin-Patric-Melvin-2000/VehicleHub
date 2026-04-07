import mongoose from "mongoose";

const serviceRecordSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    date: { type: Date, required: true },
    odometer: { type: Number, default: null },
    service_type: { type: String, required: true },
    description: { type: String, default: null },
    cost: { type: Number, default: 0 },
    next_service_date: { type: Date, default: null },
    next_service_mileage: { type: Number, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } },
);

export const ServiceRecord = mongoose.model("ServiceRecord", serviceRecordSchema, "service_records");
