/**
 * App Module
 * Main application controller that orchestrates MetaMask, theme, i18n,
 * and communicates with the backend API to display wallet data.
 */

const App = (() => {
  // Auto-detect API base URL:
  // - On Vercel (production): same origin → "/api"
  // - On localhost (dev): backend runs on port 3000 → "http://localhost:3000/api"
  const API_BASE =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:3000/api"
      : "/api";

  // Application state
  let connectedAddress = null;

  // =========================================================================
  // DOM Element References
  // =========================================================================

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  // =========================================================================
  // API Communication
  // =========================================================================

  /**
   * Fetches the ETH balance for a wallet address from the backend.
   * @param {string} address - Ethereum wallet address
   * @returns {Promise<Object>} Balance data
   */
  async function fetchBalance(address) {
    const response = await fetch(`${API_BASE}/wallet/${address}/balance`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to fetch balance");
    }
    return response.json();
  }

  /**
   * Fetches the last 10 transactions for a wallet address from the backend.
   * @param {string} address - Ethereum wallet address
   * @returns {Promise<Object>} Transactions data
   */
  async function fetchTransactions(address) {
    const response = await fetch(
      `${API_BASE}/wallet/${address}/transactions?limit=10`,
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to fetch transactions");
    }
    return response.json();
  }

  // =========================================================================
  // UI Rendering
  // =========================================================================

  /**
   * Shows the landing (disconnected) state.
   */
  function showLandingState() {
    $("#landing-section").classList.remove("hidden");
    $("#wallet-section").classList.add("hidden");
    $("#connect-btn").classList.remove("hidden");
    $("#disconnect-btn").classList.add("hidden");
    clearError();
  }

  /**
   * Shows the connected (wallet) state.
   */
  function showWalletState() {
    $("#landing-section").classList.add("hidden");
    $("#wallet-section").classList.remove("hidden");
    $("#connect-btn").classList.add("hidden");
    $("#disconnect-btn").classList.remove("hidden");
    clearError();
  }

  /**
   * Truncates an Ethereum address for display.
   * @param {string} address - Full address
   * @returns {string} Truncated address (e.g., "0x1234...abcd")
   */
  function truncateAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Formats a number to a fixed number of decimal places.
   * @param {string|number} value - The value to format
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted number
   */
  function formatBalance(value, decimals = 4) {
    return parseFloat(value).toFixed(decimals);
  }

  /**
   * Formats an ISO timestamp to a human-readable date string.
   * @param {string} isoString - ISO date string
   * @returns {string} Formatted date
   */
  function formatDate(isoString) {
    const date = new Date(isoString);
    const lang = I18n.getCurrentLang();
    return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Renders the wallet info (address, balance, network).
   * @param {string} address - Wallet address
   * @param {Object} balanceData - Balance data from API
   */
  function renderWalletInfo(address, balanceData) {
    $("#wallet-address-value").textContent = truncateAddress(address);
    $("#wallet-address-value").title = address; // Full address on hover
    $("#wallet-balance-value").textContent = `${formatBalance(
      balanceData.balance,
    )} ETH`;
    $("#wallet-network-value").textContent = I18n.t("wallet.network.sepolia");
  }

  /**
   * Renders the transaction list as cards.
   * @param {Array} transactions - Array of transaction objects
   * @param {string} walletAddress - The connected wallet address
   */
  function renderTransactions(transactions, walletAddress) {
    const container = $("#transactions-list");
    container.innerHTML = "";

    if (!transactions || transactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p data-i18n="tx.empty">${I18n.t("tx.empty")}</p>
        </div>
      `;
      return;
    }

    transactions.forEach((tx, index) => {
      const isOutgoing = tx.direction === "out";
      const card = document.createElement("div");
      card.className = "tx-card";
      card.style.animationDelay = `${index * 0.05}s`;

      const statusClass =
        tx.status === "success" ? "status-success" : "status-failed";
      const directionClass = isOutgoing ? "direction-out" : "direction-in";
      const directionText = isOutgoing
        ? I18n.t("tx.direction.out")
        : I18n.t("tx.direction.in");
      const directionIcon = isOutgoing ? "↗" : "↙";
      const statusText =
        tx.status === "success"
          ? I18n.t("tx.status.success")
          : I18n.t("tx.status.failed");

      card.innerHTML = `
        <div class="tx-card-header">
          <div class="tx-direction ${directionClass}">
            <span class="tx-direction-icon">${directionIcon}</span>
            <span>${directionText}</span>
          </div>
          <span class="tx-status ${statusClass}">${statusText}</span>
        </div>
        <div class="tx-card-body">
          <div class="tx-detail">
            <span class="tx-label">${I18n.t("tx.value")}</span>
            <span class="tx-value-amount">${formatBalance(tx.value, 6)} ETH</span>
          </div>
          <div class="tx-detail">
            <span class="tx-label">${I18n.t("tx.from")}</span>
            <span class="tx-value" title="${tx.from}">${truncateAddress(tx.from)}</span>
          </div>
          <div class="tx-detail">
            <span class="tx-label">${I18n.t("tx.to")}</span>
            <span class="tx-value" title="${tx.to}">${truncateAddress(tx.to)}</span>
          </div>
          <div class="tx-detail">
            <span class="tx-label">${I18n.t("tx.date")}</span>
            <span class="tx-value">${formatDate(tx.timestamp)}</span>
          </div>
          <div class="tx-detail">
            <span class="tx-label">${I18n.t("tx.gas")}</span>
            <span class="tx-value">${parseInt(tx.gasUsed).toLocaleString()}</span>
          </div>
        </div>
        <div class="tx-card-footer">
          <a href="https://sepolia.etherscan.io/tx/${tx.hash}" 
             target="_blank" rel="noopener noreferrer" 
             class="tx-etherscan-link">
            ${I18n.t("tx.viewOnEtherscan")} ↗
          </a>
        </div>
      `;

      container.appendChild(card);
    });
  }

  /**
   * Shows a loading spinner in the given container.
   * @param {string} selector - CSS selector for the container
   */
  function showLoading(selector) {
    const el = $(selector);
    if (el) {
      el.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p data-i18n="loading">${I18n.t("loading")}</p>
        </div>
      `;
    }
  }

  /**
   * Displays an error message to the user.
   * @param {string} message - Error message to display
   */
  function showError(message) {
    const errorEl = $("#error-message");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
    }
  }

  /**
   * Clears any displayed error message.
   */
  function clearError() {
    const errorEl = $("#error-message");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.add("hidden");
    }
  }

  // =========================================================================
  // Core Actions
  // =========================================================================

  /**
   * Handles the "Connect with MetaMask" button click.
   * Connects wallet, fetches data, and updates the UI.
   */
  async function handleConnect() {
    try {
      clearError();
      $("#connect-btn").disabled = true;
      $("#connect-btn").textContent = I18n.t("loading");

      // Connect MetaMask
      const address = await MetaMask.connect();
      connectedAddress = address;

      // Switch to wallet view
      showWalletState();

      // Set initial placeholder values for address & balance
      // (don't use showLoading here — it would destroy these elements)
      $("#wallet-address-value").textContent = truncateAddress(address);
      $("#wallet-address-value").title = address;
      $("#wallet-balance-value").textContent = I18n.t("loading");

      // Show loading only on the transactions list (safe to overwrite)
      showLoading("#transactions-list");

      // Fetch balance from backend
      try {
        const balanceData = await fetchBalance(address);
        renderWalletInfo(address, balanceData);
      } catch (err) {
        console.error("[Balance]", err);
        $("#wallet-balance-value").textContent = "Error";
        showError(err.message);
      }

      // Fetch transactions from backend
      try {
        const txData = await fetchTransactions(address);
        renderTransactions(txData.transactions, address);
      } catch (err) {
        console.error("[Transactions]", err);
        renderTransactions([], address);
        showError(err.message);
      }
    } catch (error) {
      console.error("[Connect]", error);

      if (error.message === "METAMASK_NOT_INSTALLED") {
        showError(I18n.t("connect.install"));
        showMetaMaskInstallPrompt();
      } else if (error.message === "USER_REJECTED") {
        showError(I18n.t("connect.rejected"));
      } else {
        showError(I18n.t("connect.error"));
      }
    } finally {
      const connectBtn = $("#connect-btn");
      if (connectBtn) {
        connectBtn.disabled = false;
        connectBtn.innerHTML = `
          <img src="https://raw.githubusercontent.com/nicehash/Logos/master/MetaMask.svg" 
               alt="MetaMask" class="metamask-icon" onerror="this.style.display='none'">
          <span data-i18n="connect.button">${I18n.t("connect.button")}</span>
        `;
      }
    }
  }

  /**
   * Handles the "Disconnect" button click.
   * Clears state and returns to landing view.
   */
  function handleDisconnect() {
    connectedAddress = null;
    MetaMask.disconnect();
    showLandingState();
  }

  /**
   * Shows a prompt to install MetaMask when it's not detected.
   */
  function showMetaMaskInstallPrompt() {
    const landing = $("#landing-section");
    const existingPrompt = landing.querySelector(".install-prompt");
    if (existingPrompt) return;

    const prompt = document.createElement("div");
    prompt.className = "install-prompt";
    prompt.innerHTML = `
      <p data-i18n="connect.install">${I18n.t("connect.install")}</p>
      <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" class="install-link">
        <span data-i18n="connect.install.link">${I18n.t(
          "connect.install.link",
        )}</span> ↗
      </a>
    `;
    landing.appendChild(prompt);
  }

  /**
   * Refreshes wallet data (balance + transactions) without reconnecting.
   */
  async function refreshWalletData() {
    if (!connectedAddress) return;

    // Set address immediately (no loading spinner needed)
    $("#wallet-address-value").textContent = truncateAddress(connectedAddress);
    $("#wallet-address-value").title = connectedAddress;
    $("#wallet-balance-value").textContent = I18n.t("loading");

    // Show loading only on transactions
    showLoading("#transactions-list");

    try {
      const balanceData = await fetchBalance(connectedAddress);
      renderWalletInfo(connectedAddress, balanceData);
    } catch (err) {
      console.error("[Refresh Balance]", err);
      $("#wallet-balance-value").textContent = "Error";
    }

    try {
      const txData = await fetchTransactions(connectedAddress);
      renderTransactions(txData.transactions, connectedAddress);
    } catch (err) {
      console.error("[Refresh Transactions]", err);
      renderTransactions([], connectedAddress);
    }
  }

  // =========================================================================
  // Event Binding
  // =========================================================================

  /**
   * Sets up all event listeners and MetaMask event handlers.
   */
  function bindEvents() {
    // Connect button
    $("#connect-btn").addEventListener("click", handleConnect);

    // Disconnect button
    $("#disconnect-btn").addEventListener("click", handleDisconnect);

    // Theme toggle
    $("#theme-toggle").addEventListener("click", () => {
      Theme.toggle();
    });

    // Language toggle
    $("#lang-toggle").addEventListener("click", async () => {
      await I18n.toggleLanguage();
      // Update the lang toggle button text
      updateLangToggleText();
      // If wallet is connected, re-render with new language
      if (connectedAddress) {
        refreshWalletData();
      }
    });

    // MetaMask events
    MetaMask.registerEvents({
      onAccountsChanged: (accounts) => {
        if (accounts.length === 0) {
          // User disconnected from MetaMask
          handleDisconnect();
        } else {
          // User switched account
          connectedAddress = accounts[0];
          showWalletState();
          refreshWalletData();
        }
      },
      onChainChanged: () => {
        // Reload on network change (recommended by MetaMask)
        window.location.reload();
      },
    });
  }

  /**
   * Updates the language toggle button text based on current language.
   */
  function updateLangToggleText() {
    const langBtn = $("#lang-toggle");
    if (langBtn) {
      langBtn.textContent = I18n.t("nav.lang");
    }
  }

  // =========================================================================
  // Initialization
  // =========================================================================

  /**
   * Initializes the entire application.
   */
  async function init() {
    // Initialize sub-modules
    Theme.init();
    await I18n.init();

    // Update UI text
    updateLangToggleText();

    // Bind event listeners
    bindEvents();

    // Check if already connected (e.g., page refresh)
    const existingAccount = await MetaMask.getConnectedAccount();
    if (existingAccount) {
      const isOnSepolia = await MetaMask.isOnSepolia();
      if (isOnSepolia) {
        connectedAddress = existingAccount;
        showWalletState();
        refreshWalletData();
        return;
      }
    }

    // Default: show landing
    showLandingState();
  }

  return { init };
})();

// Start the app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
