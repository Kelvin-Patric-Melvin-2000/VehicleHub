/** Aligned with web app domain (app/src/types/domain.ts) */

export type EnergyUnit = "L" | "kWh";

export type Vehicle = {
  id: string;
  name: string;
  type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  registration_number: string | null;
  current_mileage: number;
  photo_uri: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type FuelLog = {
  id: string;
  vehicle_id: string;
  date: string;
  odometer_reading: number;
  fuel_quantity_liters: number;
  energy_unit: EnergyUnit;
  cost: number;
  fuel_station: string | null;
  created_at: string;
};

export type ServiceRecord = {
  id: string;
  vehicle_id: string;
  date: string;
  odometer: number | null;
  service_type: string;
  description: string | null;
  cost: number;
  next_service_date: string | null;
  next_service_mileage: number | null;
  created_at: string;
};
