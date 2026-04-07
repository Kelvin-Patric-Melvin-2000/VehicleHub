import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    type: { type: String, default: "motorcycle" },
    make: { type: String, default: null },
    model: { type: String, default: null },
    year: { type: Number, default: null },
    registration_number: { type: String, default: null },
    current_mileage: { type: Number, default: 0 },
    photo_url: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export const Vehicle = mongoose.model("Vehicle", vehicleSchema, "vehicles");
