import mongoose from "mongoose";

const reminderSentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    /** UTC calendar day YYYY-MM-DD */
    day_bucket: { type: String, required: true },
    /** e.g. service:507f1f77bcf86cd799439011 */
    reminder_key: { type: String, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } },
);

reminderSentSchema.index({ user_id: 1, day_bucket: 1, reminder_key: 1 }, { unique: true });

export const ReminderSent = mongoose.model("ReminderSent", reminderSentSchema, "reminder_sent");
