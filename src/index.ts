import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/**
 * Root / Health
 */
app.get("/", (req, res) => {
  res.json({
    service: "onegodian-api",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Health check (explicit)
 */
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "onegodian-api",
    timestamp: new Date().toISOString(),
  });
});

/**
 * System status
 */
app.get("/v1/status", (req, res) => {
  res.json({
    status: "ok",
    service: "onegodian-api",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Public definition endpoint
 */
app.get("/v1/definition", (req, res) => {
  res.json({
    name: "ONEGODIAN",
    classification: "founder-defined identity framework",
    description: "Core API definition endpoint for Onegodian system",
  });
});

/**
 * Execution endpoint (foundation for OHI Twin / workflows)
 */
app.post("/execute", (req, res) => {
  const { task, agent, metadata } = req.body || {};

  // Basic validation (prevents crashes)
  if (!task) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: task",
    });
  }

  console.log("Execution request:", {
    task,
    agent,
    metadata,
    timestamp: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: "Execution received",
    input: { task, agent },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Server start
 */
app.listen(PORT, () => {
  console.log(`Onegodian API running on port ${PORT}`);
});
