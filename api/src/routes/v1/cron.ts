import { Router } from "express";
import { runReminderDispatch } from "../../lib/reminderDispatch.js";

const router = Router();

router.post("/cron/reminders", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const result = await runReminderDispatch();
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Dispatch failed" });
  }
});

export default router;
