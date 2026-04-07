export type AppUser = {
  id: string;
  email: string;
  displayName: string | null;
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
};

export type FuelLog = {
  id: string;
  vehicle_id: string;
  user_id: string;
  date: string;
  odometer_reading: number;
  fuel_quantity_liters: number;
  cost: number;
  fuel_station: string | null;
  created_at: string;
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
