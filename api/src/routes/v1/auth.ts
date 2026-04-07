import { Router } from "express";
import { notImplemented } from "../../lib/notImplemented.js";

const router = Router();

router.post("/auth/sign-up", notImplemented);
router.post("/auth/sign-in", notImplemented);
router.post("/auth/sign-out", notImplemented);
router.get("/auth/session", notImplemented);

export default router;
