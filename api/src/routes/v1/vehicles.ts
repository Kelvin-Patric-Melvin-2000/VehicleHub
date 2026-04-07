import { Router } from "express";
import { notImplemented } from "../../lib/notImplemented.js";

const router = Router();

router.get("/vehicles", notImplemented);
router.post("/vehicles", notImplemented);
router.get("/vehicles/:vehicleId", notImplemented);
router.patch("/vehicles/:vehicleId", notImplemented);
router.delete("/vehicles/:vehicleId", notImplemented);

export default router;
