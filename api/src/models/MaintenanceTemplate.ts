import mongoose from "mongoose";

const maintenanceTemplateSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    service_type: { type: String, required: true },
    interval_km: { type: Number, default: null },
    interval_months: { type: Number, default: null },
    /** If set, template applies only to this vehicle type slug; null = all types */
    vehicle_type: { type: String, default: null },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } },
);

export const MaintenanceTemplate = mongoose.model(
  "MaintenanceTemplate",
  maintenanceTemplateSchema,
  "maintenance_templates",
);
