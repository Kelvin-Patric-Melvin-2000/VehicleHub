import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    display_name: { type: String, default: null },
    notification_email_enabled: { type: Boolean, default: true },
    reminder_lead_days_service: { type: Number, default: 7 },
    reminder_lead_days_documents: { type: Number, default: 14 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export const User = mongoose.model("User", userSchema, "users");
