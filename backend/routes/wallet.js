/**
 * Wallet Routes
 * Express router for wallet-related API endpoints.
 * These routes act as the interface between the frontend and the blockchain service.
 */

const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchain");

/**
 * GET /api/wallet/:address/balance
 * Returns the ETH balance for the given wallet address on Sepolia testnet.
 */
router.get("/:address/balance", async (req, res) => {
  try {
    const { address } = req.params;
    const result = await blockchainService.getBalance(address);
    res.json(result);
  } catch (error) {
    console.error("[Balance Error]", error.message);

    if (error.message === "Invalid Ethereum address") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Failed to fetch balance. Please try again later.",
    });
  }
});

/**
 * GET /api/wallet/:address/transactions
 * Returns the last 10 transactions for the given wallet address on Sepolia testnet.
 * Query param: ?limit=10 (optional, default 10)
 */
router.get("/:address/transactions", async (req, res) => {
  try {
    const { address } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const result = await blockchainService.getTransactions(address, limit);
    res.json(result);
  } catch (error) {
    console.error("[Transactions Error]", error.message);

    if (error.message === "Invalid Ethereum address") {
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes("Etherscan API key")) {
      return res.status(503).json({ error: error.message });
    }

    res.status(500).json({
      error: "Failed to fetch transactions. Please try again later.",
    });
  }
});

module.exports = router;
