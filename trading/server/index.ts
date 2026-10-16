import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { initDatabase } from "./db.js";
import { depositRouter } from "./routes/deposit.js";
import { userRouter } from "./routes/user.js";
import { adminRouter } from "./routes/admin.js";
import { marketRouter } from "./routes/market.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, "..", "dist");

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
initDatabase();

// Mount API Routes
app.use("/api/deposit", depositRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/market-data", marketRouter);
app.use("/api/market", marketRouter);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Trading MiniApp Internal Backend",
  });
});

// Production Static Assets & SPA Fallback
if (existsSync(distPath)) {
  app.use(
    express.static(distPath, {
      maxAge: "7d",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else if (filePath.match(/\.(js|css|webp|png|jpg|svg|woff2?)$/)) {
          res.setHeader("Cache-Control", "public, max-age=604800, immutable");
        }
      },
    })
  );
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.sendFile(path.join(distPath, "index.html"));
    }
    next();
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Internal Backend Server running at http://localhost:${PORT}`);
  console.log(`📡 Single-Endpoint Deposit Verification available at: POST http://localhost:${PORT}/api/deposit/verify`);
});
