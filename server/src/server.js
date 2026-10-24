
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import connectDB from "./config/db.js";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const clientDistPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../client/dist"
);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
  })
);

app.use(express.json());

app.use("/api/tasks", taskRoutes);

app.use(express.static(clientDistPath));
app.use((req, res, next) => {
  const requestPath = req.path.toLowerCase();
  if (
    req.method !== "GET" ||
    requestPath === "/api" ||
    requestPath.startsWith("/api/")
  ) {
    return next();
  }

  res.sendFile(resolve(clientDistPath, "index.html"));
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`StudyTrack server running on http://localhost:${PORT}`);
  });
};

startServer();
