/**
 * XRPL Testnet Client & Wallet Manager
 * Connects to XRPL Testnet via WebSocket and manages server-side signing keys.
 */

const xrpl = require('xrpl');

const TESTNET_URL = process.env.XRPL_NODE_URL || 'wss://s.altnet.rippletest.net:51233';

let clientInstance = null;
let adminWallet = null;

/**
 * Get or initialize the XRPL WebSocket Client
 */
async function getXRPLClient() {
  if (!clientInstance) {
    clientInstance = new xrpl.Client(TESTNET_URL);
  }
  if (!clientInstance.isConnected()) {
    console.log(`[XRPL] Connecting to Testnet node: ${TESTNET_URL}...`);
    await clientInstance.connect();
    console.log('[XRPL] Connected successfully to XRPL Testnet!');
  }
  return clientInstance;
}

/**
 * Get or auto-fund the Admin/Sponsor Disbursement Wallet
 */
async function getAdminWallet() {
  if (adminWallet) {
    return adminWallet;
  }

  const client = await getXRPLClient();

  if (process.env.XRPL_ADMIN_SEED) {
    console.log('[XRPL] Loading Admin Wallet from environment seed...');
    adminWallet = xrpl.Wallet.fromSeed(process.env.XRPL_ADMIN_SEED);
  } else {
    console.log('[XRPL] No XRPL_ADMIN_SEED found in environment. Generating & auto-funding new Admin Wallet from Testnet Faucet...');
    const fundResult = await client.fundWallet();
    adminWallet = fundResult.wallet;
    console.log(`[XRPL] Admin Wallet funded! Address: ${adminWallet.address} (Balance: ${fundResult.balance} XRP)`);
  }

  return adminWallet;
}

/**
 * Create and fund a synthetic student wallet on XRPL Testnet
 */
async function createAndFundStudentWallet() {
  const client = await getXRPLClient();
  console.log('[XRPL] Funding new synthetic student wallet on Testnet...');
  const fundResult = await client.fundWallet();
  return {
    address: fundResult.wallet.address,
    seed: fundResult.wallet.seed,
    balance: fundResult.balance
  };
}

/**
 * Query live ledger info for any XRPL account
 */
async function getAccountLedgerInfo(address) {
  if (!address || !address.startsWith('r')) {
    return { error: 'Invalid XRPL address format' };
  }

  const client = await getXRPLClient();
  try {
    const response = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated'
    });

    const accountData = response.result.account_data;
    const balanceXRP = xrpl.dropsToXrp(accountData.Balance);

    return {
      address: accountData.Account,
      balanceXRP: parseFloat(balanceXRP),
      sequence: accountData.Sequence,
      ownerCount: accountData.OwnerCount,
      ledgerIndex: response.result.ledger_index,
      validated: response.result.validated
    };
  } catch (error) {
    // If account not found on ledger (unactivated, < 1 XRP)
    return {
      address,
      balanceXRP: 0,
      unactivated: true,
      error: error.message
    };
  }
}

/**
 * Disconnect client (useful for graceful shutdown and tests)
 */
async function disconnectXRPL() {
  if (clientInstance && clientInstance.isConnected()) {
    await clientInstance.disconnect();
    console.log('[XRPL] Disconnected from Testnet.');
  }
}

module.exports = {
  getXRPLClient,
  getAdminWallet,
  createAndFundStudentWallet,
  getAccountLedgerInfo,
  disconnectXRPL,
  TESTNET_URL
};
