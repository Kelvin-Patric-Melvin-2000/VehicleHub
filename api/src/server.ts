import cors from "cors";
import express from "express";
import apiV1 from "./routes/index.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api/v1", apiV1);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
