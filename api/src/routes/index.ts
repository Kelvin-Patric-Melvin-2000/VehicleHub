import { Router } from "express";
import analyticsRouter from "./v1/analytics.js";
import authRouter from "./v1/auth.js";
import documentsRouter from "./v1/documents.js";
import fuelLogsRouter from "./v1/fuelLogs.js";
import healthRouter from "./v1/health.js";
import serviceRecordsRouter from "./v1/serviceRecords.js";
import vehicleTypesRouter from "./v1/vehicleTypes.js";
import vehiclesRouter from "./v1/vehicles.js";

const router = Router();

router.use(healthRouter);
router.use(vehicleTypesRouter);
router.use(authRouter);
router.use(vehiclesRouter);
router.use(fuelLogsRouter);
router.use(serviceRecordsRouter);
router.use(documentsRouter);
router.use(analyticsRouter);

export default router;
