import { connectDb } from "../db.js";
import { seedVehicleTypes } from "../seed/vehicleTypes.js";
import { seedDemoData } from "../seed/demoData.js";

async function main() {
  await connectDb();
  await seedVehicleTypes();
  const result = await seedDemoData();
  console.log(result.message);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
