import path from "node:path";
import express from "express";
import cors from "cors";
import downloadRouter from "./routes/download.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:4000",
      "http://127.0.0.1:5500",
      "https://neuralytdl.vercel.app",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "ngrok-skip-browser-warning"], // <-- Allow the header
  })
);

app.use(express.json());

app.use("/api", downloadRouter);

const clientDir = path.join(process.cwd(), "src", "client");
app.use(express.static(clientDir));

app.get("/", (_req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

export default app;
