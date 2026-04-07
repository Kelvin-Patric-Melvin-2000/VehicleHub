import { Router } from "express";
import { notImplemented } from "../../lib/notImplemented.js";

const router = Router();

router.get("/documents", notImplemented);
router.post("/documents", notImplemented);
router.delete("/documents/:documentId", notImplemented);
router.post("/documents/upload", notImplemented);

export default router;
