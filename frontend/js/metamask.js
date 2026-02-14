/**
 * MetaMask Module
 * Handles wallet connection/disconnection via the MetaMask browser extension.
 * Uses the window.ethereum provider injected by MetaMask.
 */

const MetaMask = (() => {
  // Sepolia chain ID in hexadecimal
  const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in decimal

  // Track whether the user has explicitly disconnected.
  // This prevents auto-reconnection after clicking "Disconnect".
  let userDisconnected = false;

  /**
   * Checks if MetaMask (or a compatible wallet) is installed.
   * @returns {boolean} True if window.ethereum is available
   */
  function isInstalled() {
    return typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask;
  }

  /**
   * Requests the user to connect their MetaMask wallet.
   * After a disconnect, forces MetaMask to re-prompt the user
   * by first requesting fresh permissions, then requesting accounts.
   * @returns {Promise<string>} The connected wallet address
   * @throws {Error} If MetaMask is not installed, user rejects, or connection fails
   */
  async function connect() {
    if (!isInstalled()) {
      throw new Error("METAMASK_NOT_INSTALLED");
    }

    try {
      if (userDisconnected) {
        // Force MetaMask to show the account picker again by
        // revoking current permissions first, then requesting new ones.
        // wallet_requestPermissions opens the MetaMask popup.
        const permissions = await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });

        // After the user approves in the popup, get accounts
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (!accounts || accounts.length === 0) {
          throw new Error("NO_ACCOUNTS");
        }

        // Reset disconnect flag on successful connection
        userDisconnected = false;

        // Check network
        await ensureSepolia();

        return accounts[0];
      } else {
        // Normal first-time connect
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (!accounts || accounts.length === 0) {
          throw new Error("NO_ACCOUNTS");
        }

        // Check network
        await ensureSepolia();

        return accounts[0];
      }
    } catch (error) {
      if (error.code === 4001) {
        // User rejected the connection request
        throw new Error("USER_REJECTED");
      }
      throw error;
    }
  }

  /**
   * Checks if on Sepolia and switches if not.
   */
  async function ensureSepolia() {
    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    if (chainId !== SEPOLIA_CHAIN_ID) {
      await switchToSepolia();
    }
  }

  /**
   * Requests MetaMask to switch to the Sepolia testnet.
   * If Sepolia is not added to MetaMask, attempts to add it.
   * @throws {Error} If user rejects the network switch
   */
  async function switchToSepolia() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (error) {
      // Chain not added to MetaMask — add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID,
              chainName: "Sepolia Testnet",
              nativeCurrency: {
                name: "Sepolia ETH",
                symbol: "SEP",
                decimals: 18,
              },
              rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Disconnects the wallet by setting the disconnect flag and
   * revoking MetaMask permissions so the next connect forces a re-prompt.
   */
  function disconnect() {
    userDisconnected = true;

    // Try to revoke permissions (supported in MetaMask 11.5+)
    // This makes MetaMask "forget" that this site was connected,
    // so the next eth_requestAccounts will show the popup.
    if (isInstalled()) {
      window.ethereum
        .request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        })
        .catch(() => {
          // Silently fail if not supported — the userDisconnected
          // flag + wallet_requestPermissions fallback will handle it
        });
    }

    return true;
  }

  /**
   * Gets the currently connected account address (without prompting).
   * Returns null if the user has explicitly disconnected.
   * @returns {Promise<string|null>} The connected address or null
   */
  async function getConnectedAccount() {
    if (!isInstalled()) return null;
    if (userDisconnected) return null;

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      return accounts.length > 0 ? accounts[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * Gets the current chain ID.
   * @returns {Promise<string>} Chain ID in hex format
   */
  async function getChainId() {
    if (!isInstalled()) return null;
    return window.ethereum.request({ method: "eth_chainId" });
  }

  /**
   * Checks if the user is connected to Sepolia.
   * @returns {Promise<boolean>}
   */
  async function isOnSepolia() {
    const chainId = await getChainId();
    return chainId === SEPOLIA_CHAIN_ID;
  }

  /**
   * Returns whether the user has explicitly disconnected.
   * @returns {boolean}
   */
  function isDisconnected() {
    return userDisconnected;
  }

  /**
   * Registers event listeners for MetaMask events.
   * @param {Object} handlers - Event handler functions
   * @param {Function} handlers.onAccountsChanged - Called when user switches account
   * @param {Function} handlers.onChainChanged - Called when user switches network
   * @param {Function} handlers.onDisconnect - Called on disconnect
   */
  function registerEvents(handlers) {
    if (!isInstalled()) return;

    if (handlers.onAccountsChanged) {
      window.ethereum.on("accountsChanged", handlers.onAccountsChanged);
    }

    if (handlers.onChainChanged) {
      window.ethereum.on("chainChanged", handlers.onChainChanged);
    }

    if (handlers.onDisconnect) {
      window.ethereum.on("disconnect", handlers.onDisconnect);
    }
  }

  return {
    isInstalled,
    connect,
    disconnect,
    getConnectedAccount,
    getChainId,
    isOnSepolia,
    isDisconnected,
    switchToSepolia,
    registerEvents,
    SEPOLIA_CHAIN_ID,
  };
})();
