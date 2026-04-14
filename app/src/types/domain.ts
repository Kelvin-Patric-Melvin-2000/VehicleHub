export type AppUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export type VehicleTypeOption = {
  slug: string;
  label: string;
  sort_order: number;
};

export type MaintenanceTemplate = {
  id: string;
  label: string;
  service_type: string;
  interval_km: number | null;
  interval_months: number | null;
  vehicle_type: string | null;
  sort_order: number;
};

export type Vehicle = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  registration_number: string | null;
  current_mileage: number;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  /** Present when vehicle is shared with the current user */
  access?: "owner" | "view" | "edit";
};

export type EnergyUnit = "L" | "kWh";

export type FuelLog = {
  id: string;
  vehicle_id: string;
  user_id: string;
  date: string;
  odometer_reading: number;
  fuel_quantity_liters: number;
  energy_unit: EnergyUnit;
  cost: number;
  fuel_station: string | null;
  created_at: string;
  /** Present on create response when odometer jump is unusually large. */
  warnings?: string[];
};

export type ServiceRecord = {
  id: string;
  vehicle_id: string;
  user_id: string;
  date: string;
  odometer: number | null;
  service_type: string;
  description: string | null;
  cost: number;
  next_service_date: string | null;
  next_service_mileage: number | null;
  created_at: string;
  vehicles?: { name: string };
};

export type FleetFuelAnalytics = {
  fillCount: number;
  fillCountLiquid: number;
  fillCountElectric: number;
  thisMonthFuelCost: number;
  thisMonthLiquidFuelCost: number;
  thisMonthEvCost: number;
  thisMonthKWhCharged: number;
  avgKmPerL: string | null;
  avgPricePerLiter: string | null;
  economySampleCount: number;
};

export type FleetSummary = {
  upcomingServicesCount: number;
  expiringDocumentsCount: number;
  expiredDocumentsCount: number;
  attentionVehicleIds: string[];
  tcoByMonth: { month: string; fuelCost: number; serviceCost: number; total: number }[];
  fleetCostPerKm: string | null;
  totalFuelSpend: number;
  totalServiceSpend: number;
  totalCostOfOwnership: number;
};

export type VehicleFuelAnalytics = {
  analyticsMode: "liquid" | "electric";
  fillCount: number;
  totalQuantity: number;
  totalCost: number;
  avgEconomy: string | null;
  avgCostPerKm: string | null;
  avgPricePerUnit: string | null;
  monthly: { month: string; cost: number }[];
  monthlyAvgPrice: { month: string; avgPricePerUnit: number }[];
  priceTrend: { date: string; pricePerUnit: number }[];
  economyTrend: { date: string; economy: number }[];
  economySampleCount: number;
};

export type VehicleDocument = {
  id: string;
  vehicle_id: string;
  user_id: string;
  document_type: string;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
  vehicles?: { name: string };
};
