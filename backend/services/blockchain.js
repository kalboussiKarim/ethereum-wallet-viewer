/**
 * Blockchain Service
 * Handles all Ethereum blockchain interactions via ethers.js and Etherscan API V2.
 * This service abstracts away the blockchain complexity from the routes layer.
 */

const { ethers } = require("ethers");

// Etherscan V2 API (unified endpoint with chainid parameter)
const ETHERSCAN_V2_URL = "https://api.etherscan.io/v2/api";

// Sepolia chain ID
const SEPOLIA_CHAIN_ID = 11155111;

/**
 * Creates and returns an ethers.js provider connected to Sepolia testnet.
 * @returns {ethers.JsonRpcProvider} Sepolia provider instance
 */
function getProvider() {
  const rpcUrl =
    process.env.SEPOLIA_RPC_URL ||
    "https://ethereum-sepolia-rpc.publicnode.com";
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Validates an Ethereum address format.
 * @param {string} address - The Ethereum address to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidAddress(address) {
  try {
    ethers.getAddress(address); // Throws if invalid
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetches the ETH balance for a given address on Sepolia testnet.
 * @param {string} address - The Ethereum wallet address
 * @returns {Promise<Object>} Object containing address, balance (in ETH), and network
 * @throws {Error} If address is invalid or RPC call fails
 */
async function getBalance(address) {
  if (!isValidAddress(address)) {
    throw new Error("Invalid Ethereum address");
  }

  const provider = getProvider();
  const balanceWei = await provider.getBalance(address);
  const balanceEth = ethers.formatEther(balanceWei);

  return {
    address,
    balance: balanceEth,
    network: "sepolia",
  };
}

/**
 * Fetches the last N transactions for a given address on Sepolia testnet
 * using the Etherscan V2 API (since ethers.js cannot natively list tx history).
 * @param {string} address - The Ethereum wallet address
 * @param {number} limit - Maximum number of transactions to return (default: 10)
 * @returns {Promise<Object>} Object containing address, network, and transactions array
 * @throws {Error} If address is invalid or Etherscan API call fails
 */
async function getTransactions(address, limit = 10) {
  if (!isValidAddress(address)) {
    throw new Error("Invalid Ethereum address");
  }

  const apiKey = process.env.ETHERSCAN_API_KEY;

  if (!apiKey || apiKey === "your_etherscan_api_key_here") {
    throw new Error(
      "Etherscan API key not configured. Please add it to your .env file.",
    );
  }

  // Etherscan V2 API: unified endpoint with chainid parameter
  const url = new URL(ETHERSCAN_V2_URL);
  url.searchParams.set("chainid", String(SEPOLIA_CHAIN_ID));
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "txlist");
  url.searchParams.set("address", address);
  url.searchParams.set("startblock", "0");
  url.searchParams.set("endblock", "99999999");
  url.searchParams.set("page", "1");
  url.searchParams.set("offset", String(limit));
  url.searchParams.set("sort", "desc"); // Most recent first
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Etherscan API returned status ${response.status}`);
  }

  const data = await response.json();

  // Etherscan returns status "0" for errors or no results
  if (data.status === "0" && data.message === "NOTOK") {
    throw new Error(`Etherscan API error: ${data.result}`);
  }

  // Parse and format transactions
  const transactions = (data.result || []).map((tx) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to || "Contract Creation",
    value: ethers.formatEther(tx.value),
    gasUsed: tx.gasUsed,
    gasPrice: ethers.formatUnits(tx.gasPrice, "gwei"),
    status: tx.txreceipt_status === "1" ? "success" : "failed",
    timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
    blockNumber: parseInt(tx.blockNumber),
    confirmations: parseInt(tx.confirmations),
    direction: tx.from.toLowerCase() === address.toLowerCase() ? "out" : "in",
  }));

  return {
    address,
    network: "sepolia",
    transactions,
  };
}

module.exports = {
  getBalance,
  getTransactions,
  isValidAddress,
};
