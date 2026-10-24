
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to StudyTrack API" });
});

app.use("/api/tasks", taskRoutes);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`StudyTrack server running on http://localhost:${PORT}`);
  });
};

startServer();
