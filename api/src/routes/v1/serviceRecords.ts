import { Router } from "express";
import { notImplemented } from "../../lib/notImplemented.js";

const router = Router();

router.get("/service-records", notImplemented);
router.post("/service-records", notImplemented);
router.delete("/service-records/:serviceRecordId", notImplemented);

export default router;
