import mongoose from "mongoose";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/vehiclehub";

export async function connectDb(): Promise<void> {
  await mongoose.connect(uri);
}
