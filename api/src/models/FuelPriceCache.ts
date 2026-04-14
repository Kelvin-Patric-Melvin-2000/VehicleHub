import mongoose from "mongoose";

const fuelPriceCacheSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    region: { type: String, default: "default" },
    price_per_liter: { type: Number, required: true },
    source: { type: String, default: "manual" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export const FuelPriceCache = mongoose.model("FuelPriceCache", fuelPriceCacheSchema, "fuel_price_cache");
