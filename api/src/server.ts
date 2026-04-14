import "dotenv/config";
import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { connectDb } from "./db.js";
import { seedVehicleTypes } from "./seed/vehicleTypes.js";
import { seedMaintenanceTemplates } from "./seed/maintenanceTemplates.js";
import { seedDemoData } from "./seed/demoData.js";
import apiV1 from "./routes/index.js";
import { runReminderDispatch } from "./lib/reminderDispatch.js";

async function main() {
  await connectDb();
  await seedVehicleTypes();
  await seedMaintenanceTemplates();
  if (process.env.SEED_DEMO_DATA === "true") {
    const r = await seedDemoData();
    console.log(r.message);
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3001;
  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:8080";

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use("/api/v1", apiV1);

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });

  if (process.env.REMINDER_INTERVAL_MS) {
    const ms = Number(process.env.REMINDER_INTERVAL_MS);
    if (Number.isFinite(ms) && ms >= 60_000) {
      setInterval(() => {
        runReminderDispatch().catch((e) => console.error("reminder dispatch", e));
      }, ms);
      console.log(`Reminder dispatch interval: ${ms}ms`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
