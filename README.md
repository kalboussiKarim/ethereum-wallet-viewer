# 💎 EthWallet Viewer

> A mini website to view your Ethereum wallet balance and transaction history on the Sepolia testnet, powered by MetaMask.

**M2DISS — UE Blockchain 2026 · Project 1**

---

## ✨ Features

- 🦊 **MetaMask Integration** — Connect/disconnect your wallet via the MetaMask browser extension
- 💰 **ETH Balance** — View your real-time balance on Sepolia testnet
- 📜 **Transaction History** — Browse your last 10 transactions with full details
- 🌗 **Dark / Light Mode** — Toggle between themes (preference saved)
- 🌐 **English / French** — Full internationalization support
- 📱 **Responsive** — Works on desktop and mobile
- ⚠️ **Error Handling** — Graceful handling of all edge cases (MetaMask not installed, wrong network, API errors)

---

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS)  ←→  Backend (Node.js + Express)  ←→  Ethereum Sepolia (via ethers.js + Etherscan API)
         ↑
   MetaMask (wallet auth)
```

- **Frontend**: Vanilla HTML, CSS, and JavaScript — no frameworks
- **Backend**: Node.js + Express — serves API endpoints for balance and transaction data
- **Blockchain**: ethers.js for balance queries, Etherscan API for transaction history
- **Decoupled**: Frontend communicates with backend via REST API; never calls the blockchain directly

---

## 📁 Project Structure

```
blockchain-wallet-viewer/
├── frontend/
│   ├── index.html              # Single page application
│   ├── css/styles.css          # Styles with dark/light theme support
│   ├── js/
│   │   ├── app.js              # Main controller
│   │   ├── metamask.js         # MetaMask connection module
│   │   ├── theme.js            # Dark/light mode module
│   │   └── i18n.js             # Internationalization module
│   └── locales/
│       ├── en.json             # English translations
│       └── fr.json             # French translations
├── backend/
│   ├── server.js               # Express server entry point
│   ├── routes/wallet.js        # API route handlers
│   └── services/blockchain.js  # Blockchain interaction logic
├── .env.example                # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MetaMask](https://metamask.io/) browser extension
- A MetaMask wallet funded with Sepolia ETH ([faucet](https://sepoliafaucet.com/))
- An [Etherscan API key](https://etherscan.io/myapikey) (free)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/blockchain-wallet-viewer.git
   cd blockchain-wallet-viewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Etherscan API key:
   ```
   ETHERSCAN_API_KEY=your_key_here
   SEPOLIA_RPC_URL=https://rpc.sepolia.org
   PORT=3000
   ```

4. **Start the backend**
   ```bash
   npm run start:backend
   ```

5. **Serve the frontend** (in a new terminal)
   ```bash
   npm run start:frontend
   ```

6. **Open your browser** at `http://localhost:5500`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/wallet/:address/balance` | ETH balance on Sepolia |
| `GET` | `/api/wallet/:address/transactions` | Last 10 transactions |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Blockchain | ethers.js v6, Etherscan Sepolia API |
| Authentication | MetaMask (window.ethereum) |
| Styling | CSS Custom Properties, Glassmorphism |

---

## 📝 Notes

- The Etherscan API is used for transaction history because ethers.js cannot natively list past transactions for an address.
- MetaMask does not support programmatic disconnection — the "disconnect" button clears app state only.
- No persistent storage (database) is needed — all data is fetched live from the blockchain.

---

## 📄 License

MIT
