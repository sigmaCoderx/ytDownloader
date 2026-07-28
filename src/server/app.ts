import path from "node:path";
import express from "express";
import cors from "cors";
import downloadRouter from "./routes/download.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:4000",// allow localhost for local development 
      "https://neuralytdl.vercel.app" // allow Vercel to use
    ],
    methods: ["GET", "POST"],
    // The client now fetches the download as a Blob (instead of a plain
    // <a href> navigation), so it needs to read the real filename that
    // res.download() sets in this header across origins.
    exposedHeaders: ["Content-Disposition"],
  })
);


app.use(express.json());

app.use("/api", downloadRouter);

// const clientDir = path.join(process.cwd(), "src", "client");
// app.use(express.static(clientDir));

// app.get("/", (_req, res) => {
//   res.sendFile(path.join(clientDir, "index.html"));
// });

app.get("/api/health", (_, res) => {
  res.status(200).json({
    status: "ok",
  });
});

export default app;
