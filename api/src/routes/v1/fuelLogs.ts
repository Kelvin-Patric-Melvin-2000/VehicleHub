import { Router } from "express";
import { notImplemented } from "../../lib/notImplemented.js";

const router = Router();

router.get("/vehicles/:vehicleId/fuel-logs", notImplemented);
router.post("/vehicles/:vehicleId/fuel-logs", notImplemented);
router.delete("/fuel-logs/:fuelLogId", notImplemented);

export default router;
