import "dotenv/config";
import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { connectDb } from "./db.js";
import apiV1 from "./routes/index.js";

async function main() {
  await connectDb();

  const app = express();
  const PORT = Number(process.env.PORT) || 3001;
  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:8080";

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use("/api/v1", apiV1);

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
