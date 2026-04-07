import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "../db.js";
import { seedVehicleTypes } from "../seed/vehicleTypes.js";

async function main() {
  await connectDb();
  await seedVehicleTypes();
  console.log("Vehicle types seeded.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
