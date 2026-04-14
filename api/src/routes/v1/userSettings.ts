import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { User } from "../../models/User.js";

const router = Router();
router.use(requireAuth);

router.get("/me/notification-settings", async (req, res) => {
  const u = await User.findById(req.userId)
    .select("notification_email_enabled reminder_lead_days_service reminder_lead_days_documents")
    .lean();
  if (!u) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    notification_email_enabled: u.notification_email_enabled !== false,
    reminder_lead_days_service: u.reminder_lead_days_service ?? 7,
    reminder_lead_days_documents: u.reminder_lead_days_documents ?? 14,
  });
});

router.patch("/me/notification-settings", async (req, res) => {
  const b = req.body ?? {};
  const $set: Record<string, unknown> = {};
  if ("notification_email_enabled" in b) {
    $set.notification_email_enabled = Boolean(b.notification_email_enabled);
  }
  if ("reminder_lead_days_service" in b) {
    const n = Number(b.reminder_lead_days_service);
    if (Number.isFinite(n)) $set.reminder_lead_days_service = Math.min(90, Math.max(0, Math.round(n)));
  }
  if ("reminder_lead_days_documents" in b) {
    const n = Number(b.reminder_lead_days_documents);
    if (Number.isFinite(n)) $set.reminder_lead_days_documents = Math.min(90, Math.max(0, Math.round(n)));
  }
  if (Object.keys($set).length === 0) {
    res.status(400).json({ error: "No valid fields" });
    return;
  }
  const u = await User.findByIdAndUpdate(req.userId, { $set }, { new: true })
    .select("notification_email_enabled reminder_lead_days_service reminder_lead_days_documents")
    .lean();
  if (!u) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    notification_email_enabled: u.notification_email_enabled !== false,
    reminder_lead_days_service: u.reminder_lead_days_service ?? 7,
    reminder_lead_days_documents: u.reminder_lead_days_documents ?? 14,
  });
});

export default router;
