import { MaintenanceTemplate } from "../models/MaintenanceTemplate.js";

const defaults = [
  { label: "Engine oil", service_type: "Oil change", interval_km: 5000, interval_months: 6, vehicle_type: null, sort_order: 10 },
  { label: "Chain service (bike)", service_type: "Chain clean & lube", interval_km: 500, interval_months: 2, vehicle_type: "motorcycle", sort_order: 20 },
  { label: "Tyre rotation", service_type: "Tyre rotation", interval_km: 10000, interval_months: null, vehicle_type: "car", sort_order: 30 },
  { label: "Brake pads", service_type: "Brake inspection", interval_km: 15000, interval_months: null, vehicle_type: null, sort_order: 40 },
  { label: "General service", service_type: "General service", interval_km: 3000, interval_months: 3, vehicle_type: "motorcycle", sort_order: 50 },
];

export async function seedMaintenanceTemplates() {
  const n = await MaintenanceTemplate.countDocuments();
  if (n > 0) {
    return { seeded: 0, message: "Maintenance templates already present" };
  }
  await MaintenanceTemplate.insertMany(defaults);
  return { seeded: defaults.length, message: "Maintenance templates seeded" };
}
