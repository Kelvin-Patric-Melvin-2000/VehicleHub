/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Types } from "mongoose";

function day(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().split("T")[0] ?? null;
}

/** Mongoose `.lean()` shapes are awkward to type; normalize at the boundary. */
export function toVehicleJson(doc: any, access?: "owner" | "view" | "edit") {
  const base: Record<string, unknown> = {
    id: doc._id.toString(),
    user_id: doc.user_id.toString(),
    name: doc.name,
    type: doc.type,
    make: doc.make ?? null,
    model: doc.model ?? null,
    year: doc.year ?? null,
    registration_number: doc.registration_number ?? null,
    current_mileage: doc.current_mileage,
    photo_url: doc.photo_url ?? null,
    created_at: new Date(doc.created_at).toISOString(),
    updated_at: new Date(doc.updated_at).toISOString(),
  };
  if (access) base.access = access;
  return base;
}

export function toFuelLogJson(doc: any) {
  return {
    id: doc._id.toString(),
    user_id: doc.user_id.toString(),
    vehicle_id: doc.vehicle_id.toString(),
    date: day(doc.date as Date),
    odometer_reading: doc.odometer_reading,
    fuel_quantity_liters: doc.fuel_quantity_liters,
    energy_unit: doc.energy_unit === "kWh" ? "kWh" : "L",
    cost: doc.cost,
    fuel_station: doc.fuel_station ?? null,
    created_at: new Date(doc.created_at).toISOString(),
  };
}

type PopulatedVehicleRef = Types.ObjectId | { _id: Types.ObjectId; name: string };

function vehicleIdString(vehicle_id: PopulatedVehicleRef): string {
  if (vehicle_id && typeof vehicle_id === "object" && "_id" in vehicle_id) {
    return vehicle_id._id.toString();
  }
  return (vehicle_id as Types.ObjectId).toString();
}

export function toServiceRecordJson(doc: any) {
  const base: Record<string, unknown> = {
    id: doc._id.toString(),
    user_id: doc.user_id.toString(),
    vehicle_id: vehicleIdString(doc.vehicle_id),
    date: day(doc.date as Date),
    odometer: doc.odometer ?? null,
    service_type: doc.service_type,
    description: doc.description ?? null,
    cost: doc.cost,
    next_service_date: day(doc.next_service_date as Date | null),
    next_service_mileage: doc.next_service_mileage ?? null,
    created_at: new Date(doc.created_at).toISOString(),
  };
  if (doc.vehicle_id && typeof doc.vehicle_id === "object" && "name" in doc.vehicle_id) {
    base.vehicles = { name: doc.vehicle_id.name };
  }
  return base;
}

export function toDocumentJson(doc: any) {
  const base: Record<string, unknown> = {
    id: doc._id.toString(),
    user_id: doc.user_id.toString(),
    vehicle_id: vehicleIdString(doc.vehicle_id),
    document_type: doc.document_type,
    document_number: doc.document_number ?? null,
    issue_date: day(doc.issue_date as Date | null),
    expiry_date: day(doc.expiry_date as Date | null),
    file_url: doc.file_url ?? null,
    created_at: new Date(doc.created_at).toISOString(),
    updated_at: new Date(doc.updated_at).toISOString(),
  };
  if (doc.vehicle_id && typeof doc.vehicle_id === "object" && "name" in doc.vehicle_id) {
    base.vehicles = { name: doc.vehicle_id.name };
  }
  return base;
}
