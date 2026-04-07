import { Router } from "express";
import { notImplemented } from "../../lib/notImplemented.js";

const router = Router();

router.get("/vehicles/:vehicleId/analytics/fuel", notImplemented);

export default router;
