import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send({
    status: "Onegodian API running",
    timestamp: new Date().toISOString(),
  });
});

// Execution endpoint (foundation for OHI Twin)
app.post("/execute", (req, res) => {
  const { task, agent, metadata } = req.body;

  console.log("Execution request:", { task, agent, metadata });

  res.send({
    success: true,
    message: "Execution received",
    input: { task, agent },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
