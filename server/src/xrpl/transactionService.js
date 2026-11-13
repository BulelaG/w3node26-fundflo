/**
 * XRPL Transaction Service
 * Executes signed payment transactions on XRPL Testnet and validates ledger finality.
 */

const { getXRPL, getXRPLClient, getAdminWallet } = require('./xrplClient');

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

  const xrpl = await getXRPL();
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
    const resultCode = result.meta.TransactionResult;
    const isSuccess = resultCode === 'tesSUCCESS';

    console.log(`[XRPL Transaction] Transaction processed! Result code: ${resultCode}, Hash: ${result.hash}`);

    return {
      success: isSuccess,
      resultCode,
      txHash: result.hash,
      ledgerIndex: result.ledger_index,
      fee: xrpl.dropsToXrp(result.Fee),
      explorerUrl: `https://testnet.xrpl.org/transactions/${result.hash}`
    };
  } catch (error) {
    console.error('[XRPL Transaction] Error executing payment on Testnet:', error.message);
    throw new Error(`XRPL Submission Failed: ${error.message}`);
  }
}

module.exports = {
  executePayment
};
