/**
 * XRPL Transaction Service
 * Executes signed payment transactions on XRPL Testnet and validates ledger finality.
 */

const xrpl = require('xrpl');
const { getXRPLClient, getAdminWallet } = require('./xrplClient');

/**
 * Execute an approved payment from Admin Wallet to Beneficiary Wallet on XRPL Testnet
 * 
 * @param {Object} params
 * @param {string} params.destinationAddress - Beneficiary's XRPL r-address
 * @param {number} params.amountXRP - Amount in XRP (e.g. 10)
 * @param {string} params.reference - Opaque memo or reference tag
 * @returns {Promise<Object>} Execution result with txHash and ledger confirmation
 */
async function executePayment({ destinationAddress, amountXRP, reference }) {
  if (!destinationAddress || !destinationAddress.startsWith('r')) {
    throw new Error(`Invalid destination XRPL address: ${destinationAddress}`);
  }

  if (!amountXRP || amountXRP <= 0) {
    throw new Error(`Invalid payment amount: ${amountXRP}`);
  }

  const client = await getXRPLClient();
  const adminWallet = await getAdminWallet();

  console.log(`[XRPL Transaction] Preparing Payment of ${amountXRP} XRP to ${destinationAddress}...`);

  // Convert XRP to drops (1 XRP = 1,000,000 drops)
  const amountDrops = xrpl.xrpToDrops(amountXRP.toString());

  // Construct Payment Transaction
  const paymentTx = {
    TransactionType: 'Payment',
    Account: adminWallet.address,
    Destination: destinationAddress,
    Amount: amountDrops
  };

  // Optional: Attach an opaque memo for audit reconciliation
  if (reference) {
    paymentTx.Memos = [
      {
        Memo: {
          MemoType: Buffer.from('FundFlow-Disbursement', 'utf8').toString('hex').toUpperCase(),
          MemoData: Buffer.from(reference, 'utf8').toString('hex').toUpperCase()
        }
      }
    ];
  }

  try {
    // autofill, sign and submit and wait for ledger validation (3-5 seconds)
    console.log('[XRPL Transaction] Submitting transaction and awaiting ledger consensus...');
    const response = await client.submitAndWait(paymentTx, { wallet: adminWallet });

    const result = response.result;
    const resultCode = result.meta && typeof result.meta === 'object' ? result.meta.TransactionResult : null;

    console.log(`[XRPL Transaction] Transaction processed! Result code: ${resultCode}, Hash: ${result.hash}`);

    if (resultCode === 'tesSUCCESS') {
      return {
        success: true,
        txHash: result.hash,
        resultCode: resultCode,
        ledgerIndex: result.ledger_index,
        feeDrops: result.Fee,
        explorerUrl: `https://testnet.xrpl.org/transactions/${result.hash}`
      };
    } else {
      return {
        success: false,
        txHash: result.hash,
        resultCode: resultCode,
        error: `Ledger execution failed with code: ${resultCode}`
      };
    }
  } catch (error) {
    console.error('[XRPL Transaction] Submission failed:', error.message);
    return {
      success: false,
      txHash: null,
      error: error.message
    };
  }
}

module.exports = {
  executePayment
};
