import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    document_type: { type: String, required: true },
    document_number: { type: String, default: null },
    issue_date: { type: Date, default: null },
    expiry_date: { type: Date, default: null },
    file_url: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export const DocumentModel = mongoose.model("Document", documentSchema, "documents");
