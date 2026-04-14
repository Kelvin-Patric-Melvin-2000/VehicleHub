import { User } from "../models/User.js";
import { ServiceRecord } from "../models/ServiceRecord.js";
import { DocumentModel } from "../models/Document.js";
import { ReminderSent } from "../models/ReminderSent.js";
import { sendEmail } from "./email.js";

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function utcDayBucket(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type Pending = { key: string; line: string };

export async function runReminderDispatch(): Promise<{ emailsSent: number; remindersQueued: number }> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const bucket = utcDayBucket(today);
  let emailsSent = 0;
  let remindersQueued = 0;

  const users = await User.find({}).lean();
  for (const u of users) {
    const emailEnabled = u.notification_email_enabled !== false;
    const leadSvc = Math.min(90, Math.max(0, Number(u.reminder_lead_days_service ?? 7)));
    const leadDoc = Math.min(90, Math.max(0, Number(u.reminder_lead_days_documents ?? 14)));
    const windowEndSvc = addDays(today, leadSvc);
    const windowEndDoc = addDays(today, leadDoc);

    const pending: Pending[] = [];

    const services = await ServiceRecord.find({ user_id: u._id })
      .populate("vehicle_id", "name")
      .lean();
    for (const s of services) {
      if (!s.next_service_date) continue;
      const due = new Date(s.next_service_date);
      due.setUTCHours(0, 0, 0, 0);
      if (due > windowEndSvc) continue;
      const key = `service:${s._id.toString()}`;
      const dup = await ReminderSent.findOne({ user_id: u._id, day_bucket: bucket, reminder_key: key });
      if (dup) continue;
      const vname =
        s.vehicle_id && typeof s.vehicle_id === "object" && "name" in s.vehicle_id
          ? String((s.vehicle_id as { name: string }).name)
          : "Vehicle";
      pending.push({
        key,
        line: `- Service: ${s.service_type} (${vname}) — due ${due.toISOString().slice(0, 10)}`,
      });
    }

    const docs = await DocumentModel.find({ user_id: u._id }).populate("vehicle_id", "name").lean();
    for (const doc of docs) {
      if (!doc.expiry_date) continue;
      const exp = new Date(doc.expiry_date);
      exp.setUTCHours(0, 0, 0, 0);
      if (exp > windowEndDoc) continue;
      const key = `doc:${doc._id.toString()}`;
      const dup = await ReminderSent.findOne({ user_id: u._id, day_bucket: bucket, reminder_key: key });
      if (dup) continue;
      const vname =
        doc.vehicle_id && typeof doc.vehicle_id === "object" && "name" in doc.vehicle_id
          ? String((doc.vehicle_id as { name: string }).name)
          : "Vehicle";
      pending.push({
        key,
        line: `- Document: ${doc.document_type} (${vname}) — expiry ${exp.toISOString().slice(0, 10)}`,
      });
    }

    if (pending.length === 0) continue;
    remindersQueued += pending.length;

    if (!emailEnabled) {
      for (const p of pending) {
        await ReminderSent.create({ user_id: u._id, day_bucket: bucket, reminder_key: p.key });
      }
      continue;
    }

    const body = `VehicleHub reminders for ${bucket}\n\n${pending.map((p) => p.line).join("\n")}`;
    await sendEmail(u.email, `VehicleHub: ${pending.length} reminder(s)`, body);
    for (const p of pending) {
      await ReminderSent.create({ user_id: u._id, day_bucket: bucket, reminder_key: p.key });
    }
    emailsSent += 1;
  }

  return { emailsSent, remindersQueued };
}
