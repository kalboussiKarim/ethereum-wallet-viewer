/**
 * Server Entry Point
 * Configures and starts the Express backend server.
 * Handles CORS, routes, and error middleware.
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const walletRoutes = require("./routes/wallet");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------
// Middleware
// ---------------------

// Enable CORS for frontend requests
app.use(
  cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
    methods: ["GET"],
  })
);

// Parse JSON bodies (for potential future POST endpoints)
app.use(express.json());

// ---------------------
// Routes
// ---------------------

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", network: "sepolia" });
});

// Wallet routes (balance + transactions)
app.use("/api/wallet", walletRoutes);

// ---------------------
// Error Handling
// ---------------------

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[Server Error]", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ---------------------
// Start Server
// ---------------------

app.listen(PORT, () => {
  console.log(`\n🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`📡 Network: Sepolia Testnet`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET /api/health`);
  console.log(`  GET /api/wallet/:address/balance`);
  console.log(`  GET /api/wallet/:address/transactions`);
  console.log("");
});
