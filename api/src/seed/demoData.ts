import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Vehicle } from "../models/Vehicle.js";
import { FuelLog } from "../models/FuelLog.js";
import { ServiceRecord } from "../models/ServiceRecord.js";
import { DocumentModel } from "../models/Document.js";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(10, 0, 0, 0);
  return d;
}

/**
 * Idempotent mock data for local dev: demo user, two vehicles, fuel logs (fleet analytics),
 * service reminders, and expiring documents.
 *
 * Env (optional):
 * - SEED_DEMO_EMAIL (default: demo@vehiclehub.local)
 * - SEED_DEMO_PASSWORD (default: demo123)
 */
export async function seedDemoData(): Promise<{ skipped: boolean; message: string }> {
  const email = (process.env.SEED_DEMO_EMAIL ?? "demo@vehiclehub.local").toLowerCase().trim();
  const password = process.env.SEED_DEMO_PASSWORD ?? "demo123";

  let user = await User.findOne({ email });
  if (!user) {
    const password_hash = await bcrypt.hash(password, 10);
    user = await User.create({
      email,
      password_hash,
      display_name: "Demo Rider",
    });
  }

  const userId = user._id;

  const existingVehicles = await Vehicle.countDocuments({ user_id: userId });
  if (existingVehicles > 0) {
    return {
      skipped: true,
      message: `Demo seed skipped: user ${email} already has vehicles.`,
    };
  }

  const v1 = await Vehicle.create({
    user_id: userId,
    name: "Daily Commuter",
    type: "motorcycle",
    make: "Royal Enfield",
    model: "Classic 350",
    year: 2022,
    registration_number: "KA01AB1234",
    current_mileage: 15_200,
    photo_url: null,
  });

  const v2 = await Vehicle.create({
    user_id: userId,
    name: "City Runabout",
    type: "scooter",
    make: "Honda",
    model: "Activa 6G",
    year: 2021,
    registration_number: "KA02CD5678",
    current_mileage: 8_450,
    photo_url: null,
  });

  const v3 = await Vehicle.create({
    user_id: userId,
    name: "EV Weekend",
    type: "electric_car",
    make: "Tata",
    model: "Nexon EV",
    year: 2023,
    registration_number: "KA03EV9999",
    current_mileage: 12_400,
    photo_url: null,
  });

  // Vehicle 1 — odometer rises; spans prior months + current month for "this month" spend + economy segments
  await FuelLog.insertMany([
    {
      user_id: userId,
      vehicle_id: v1._id,
      date: daysAgo(100),
      odometer_reading: 12_800,
      fuel_quantity_liters: 11,
      cost: 1188,
      fuel_station: "Shell Indiranagar",
    },
    {
      user_id: userId,
      vehicle_id: v1._id,
      date: daysAgo(72),
      odometer_reading: 13_420,
      fuel_quantity_liters: 10.5,
      cost: 1155,
      fuel_station: "HP Petrol",
    },
    {
      user_id: userId,
      vehicle_id: v1._id,
      date: daysAgo(45),
      odometer_reading: 14_050,
      fuel_quantity_liters: 11,
      cost: 1210,
      fuel_station: null,
    },
    {
      user_id: userId,
      vehicle_id: v1._id,
      date: daysAgo(18),
      odometer_reading: 14_680,
      fuel_quantity_liters: 10,
      cost: 1100,
      fuel_station: "Indian Oil",
    },
    {
      user_id: userId,
      vehicle_id: v1._id,
      date: daysAgo(9),
      odometer_reading: 15_020,
      fuel_quantity_liters: 9.5,
      cost: 1045,
      fuel_station: "Shell",
    },
    {
      user_id: userId,
      vehicle_id: v1._id,
      date: daysAgo(3),
      odometer_reading: 15_200,
      fuel_quantity_liters: 9,
      cost: 990,
      fuel_station: "BPCL",
    },
  ]);

  // Vehicle 2 — second vehicle for cross-fleet aggregation
  await FuelLog.insertMany([
    {
      user_id: userId,
      vehicle_id: v2._id,
      date: daysAgo(88),
      odometer_reading: 7_200,
      fuel_quantity_liters: 5.5,
      cost: 605,
      fuel_station: null,
    },
    {
      user_id: userId,
      vehicle_id: v2._id,
      date: daysAgo(55),
      odometer_reading: 7_680,
      fuel_quantity_liters: 5.2,
      cost: 572,
      fuel_station: "HP",
    },
    {
      user_id: userId,
      vehicle_id: v2._id,
      date: daysAgo(28),
      odometer_reading: 8_050,
      fuel_quantity_liters: 5,
      cost: 550,
      fuel_station: null,
    },
    {
      user_id: userId,
      vehicle_id: v2._id,
      date: daysAgo(11),
      odometer_reading: 8_320,
      fuel_quantity_liters: 4.8,
      cost: 528,
      fuel_station: "Indian Oil",
    },
    {
      user_id: userId,
      vehicle_id: v2._id,
      date: daysAgo(4),
      odometer_reading: 8_450,
      fuel_quantity_liters: 4.5,
      cost: 495,
      fuel_station: "Shell",
    },
  ]);

  await FuelLog.insertMany([
    {
      user_id: userId,
      vehicle_id: v3._id,
      date: daysAgo(75),
      odometer_reading: 11_200,
      fuel_quantity_liters: 38,
      energy_unit: "kWh",
      cost: 4180,
      fuel_station: "Mall DC charger",
    },
    {
      user_id: userId,
      vehicle_id: v3._id,
      date: daysAgo(48),
      odometer_reading: 11_680,
      fuel_quantity_liters: 36,
      energy_unit: "kWh",
      cost: 3960,
      fuel_station: null,
    },
    {
      user_id: userId,
      vehicle_id: v3._id,
      date: daysAgo(22),
      odometer_reading: 12_050,
      fuel_quantity_liters: 32,
      energy_unit: "kWh",
      cost: 3520,
      fuel_station: "Home AC",
    },
    {
      user_id: userId,
      vehicle_id: v3._id,
      date: daysAgo(5),
      odometer_reading: 12_400,
      fuel_quantity_liters: 28,
      energy_unit: "kWh",
      cost: 3080,
      fuel_station: "Home AC",
    },
  ]);

  await ServiceRecord.insertMany([
    {
      user_id: userId,
      vehicle_id: v1._id,
      date: daysAgo(60),
      odometer: 14_200,
      service_type: "Oil change",
      description: "Semi-synthetic 15W50",
      cost: 1800,
      next_service_date: daysFromNow(12),
      next_service_mileage: 16_000,
    },
    {
      user_id: userId,
      vehicle_id: v2._id,
      date: daysAgo(40),
      odometer: 8_000,
      service_type: "General service",
      description: "Spark plug, air filter",
      cost: 950,
      next_service_date: daysFromNow(25),
      next_service_mileage: 9_000,
    },
    {
      user_id: userId,
      vehicle_id: v3._id,
      date: daysAgo(50),
      odometer: 11_900,
      service_type: "Tyre rotation",
      description: null,
      cost: 600,
      next_service_date: daysFromNow(40),
      next_service_mileage: 14_000,
    },
  ]);

  await DocumentModel.insertMany([
    {
      user_id: userId,
      vehicle_id: v1._id,
      document_type: "Insurance",
      document_number: "POL-MOTO-2025-001",
      issue_date: daysAgo(200),
      expiry_date: daysFromNow(18),
      file_url: null,
    },
    {
      user_id: userId,
      vehicle_id: v2._id,
      document_type: "PUC",
      document_number: "PUC-KA-8899",
      issue_date: daysAgo(120),
      expiry_date: daysFromNow(8),
      file_url: null,
    },
    {
      user_id: userId,
      vehicle_id: v3._id,
      document_type: "Insurance",
      document_number: "POL-EV-2025-002",
      issue_date: daysAgo(300),
      expiry_date: daysFromNow(120),
      file_url: null,
    },
  ]);

  return {
    skipped: false,
    message: `Demo data seeded for ${email} (password: ${password}). Vehicles: "${v1.name}", "${v2.name}", "${v3.name}".`,
  };
}
