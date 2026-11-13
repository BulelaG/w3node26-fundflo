/**
 * FundFlow Independent Policy Engine
 * 
 * CRITICAL ZERO-TRUST SECURITY BOUNDARY:
 * This module enforces strict mandate limits outside of the AI agent's control.
 * The AI agent can propose payments, but ONLY this deterministic engine can
 * approve or authorize transactions.
 */

const {
  getProgrammeById,
  getBeneficiaryById,
  getScheduleById,
  updateSchedule,
  updateProgrammeBudget,
  addAuditLog
} = require('../data/store');

const { executePayment } = require('../xrpl/transactionService');
const { randomUUID } = require('crypto');

const POLICY_VERSION = '1.0.0';

/**
 * Standardized Policy Error Codes
 */
const POLICY_ERRORS = {
  PROGRAMME_NOT_FOUND: 'ERR_PROGRAMME_NOT_FOUND',
  PROGRAMME_PAUSED: 'ERR_PROGRAMME_PAUSED',
  UNAUTHORIZED_BENEFICIARY: 'ERR_UNAUTHORIZED_BENEFICIARY',
  BENEFICIARY_INACTIVE: 'ERR_BENEFICIARY_INACTIVE',
  MISSING_WALLET: 'ERR_MISSING_WALLET_ADDRESS',
  EXCEEDS_STUDENT_CAP: 'ERR_EXCEEDS_STUDENT_ALLOWANCE_CAP',
  INSUFFICIENT_BUDGET: 'ERR_INSUFFICIENT_PROGRAMME_BUDGET',
  DUPLICATE_PAYMENT: 'ERR_DUPLICATE_PAYMENT',
  SCHEDULE_NOT_FOUND: 'ERR_SCHEDULE_NOT_FOUND',
  INVALID_AMOUNT: 'ERR_INVALID_AMOUNT',
  LEDGER_EXECUTION_FAILED: 'ERR_LEDGER_EXECUTION_FAILED'
};

// XRPL classic address: base58 (no 0, O, I, l), starts with 'r', 25-35 chars.
const XRPL_ADDRESS_REGEX = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const isValidXrplAddress = (addr) => typeof addr === 'string' && XRPL_ADDRESS_REGEX.test(addr);

/**
 * Pure policy evaluation - checks mandate rules independently
 * 
 * @param {Object} paymentProposal
 * @param {string} paymentProposal.programmeId
 * @param {string} paymentProposal.studentId
 * @param {number} paymentProposal.amount
 * @param {string} paymentProposal.scheduleId
 * @returns {Object} { isValid: boolean, reasonCode: string|null, message: string }
 */
function evaluatePolicy(paymentProposal) {
  const { programmeId, studentId, amount, scheduleId } = paymentProposal;

  // 0. Amount Sanity Check (a NaN, string or negative amount must never reach the ledger)
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return {
      isValid: false,
      reasonCode: POLICY_ERRORS.INVALID_AMOUNT,
      message: `Proposed amount (${String(amount)}) is not a positive finite number of XRP.`
    };
  }

  // 1. Programme Existence Check
  const programme = getProgrammeById(programmeId);
  if (!programme) {
    return {
      isValid: false,
      reasonCode: POLICY_ERRORS.PROGRAMME_NOT_FOUND,
      message: `Funding programme ${programmeId} does not exist.`
    };
  }

  // 2. Admin Emergency Kill Switch Check
  if (programme.isPaused) {
    return {
      isValid: false,
      reasonCode: POLICY_ERRORS.PROGRAMME_PAUSED,
      message: `Programme ${programmeId} is paused by administrator. All payouts halted.`
    };
  }

  // 3. Beneficiary Existence & Whitelist Check
  const beneficiary = getBeneficiaryById(studentId);
  if (!beneficiary || !programme.beneficiaries.includes(studentId)) {
    return {
      isValid: false,
      reasonCode: POLICY_ERRORS.UNAUTHORIZED_BENEFICIARY,
      message: `Student ${studentId} is not an authorized beneficiary for programme ${programmeId}.`
    };
  }

  // 4. Beneficiary Status Check
  if (beneficiary.status !== 'ACTIVE') {
    return {
      isValid: false,
      reasonCode: POLICY_ERRORS.BENEFICIARY_INACTIVE,
      message: `Student ${studentId} account status is ${beneficiary.status} (must be ACTIVE).`
    };
  }

  // 5. Valid XRPL Destination Address Check
  if (!isValidXrplAddress(beneficiary.walletAddress)) {
    return {
      isValid: false,
      reasonCode: POLICY_ERRORS.MISSING_WALLET,
      message: `Student ${studentId} does not have a valid XRPL Testnet wallet assigned.`
    };
  }

  // 6. Allowance Limit / Individual Cap Check
  if (amount > beneficiary.monthlyAllowance) {
    return {
      isValid: false,
      reasonCode: POLICY_ERRORS.EXCEEDS_STUDENT_CAP,
      message: `Proposed amount (${amount} XRP) exceeds student allowance cap of ${beneficiary.monthlyAllowance} XRP.`
    };
  }

  // 7. Programme Budget Check
  if (programme.remainingBudget < amount) {
    return {
      isValid: false,
      reasonCode: POLICY_ERRORS.INSUFFICIENT_BUDGET,
      message: `Requested ${amount} XRP exceeds remaining programme budget of ${programme.remainingBudget} XRP.`
    };
  }

  // 8. Idempotency & Duplicate Check
  const schedule = getScheduleById(scheduleId);
  if (!schedule) {
    return {
      isValid: false,
      reasonCode: POLICY_ERRORS.SCHEDULE_NOT_FOUND,
      message: `Schedule ${scheduleId} not found.`
    };
  }

  if (schedule.status === 'VERIFIED' || schedule.txHash) {
    return {
      isValid: false,
      reasonCode: POLICY_ERRORS.DUPLICATE_PAYMENT,
      message: `Schedule ${scheduleId} has already been settled and verified on ledger. Transaction hash: ${schedule.txHash}`
    };
  }

  if (schedule.status === 'PROCESSING') {
    return {
      isValid: false,
      reasonCode: POLICY_ERRORS.DUPLICATE_PAYMENT,
      message: `Schedule ${scheduleId} is currently undergoing ledger validation. Duplicate submission blocked.`
    };
  }

  // All Policy Checks Passed!
  return {
    isValid: true,
    reasonCode: null,
    message: 'Policy verification successful. Instruction cleared for ledger execution.'
  };
}

/**
 * Validates and coordinates payment execution through the XRPL service
 * 
 * @param {Object} paymentProposal
 * @returns {Promise<Object>}
 */
async function processDisbursement(paymentProposal) {
  const { programmeId, studentId, amount, scheduleId } = paymentProposal;
  const decisionId = `DEC-${randomUUID()}`;

  // Step 1: Independent Policy Evaluation
  const policyResult = evaluatePolicy(paymentProposal);

  if (!policyResult.isValid) {
    console.warn(`[Policy Engine] REJECTED payment for ${studentId}: ${policyResult.reasonCode} - ${policyResult.message}`);
    
    // Log failure to audit trail
    addAuditLog({
      eventType: 'POLICY_REJECTION',
      programmeId,
      studentId,
      scheduleId,
      amount,
      decisionId,
      policyVersion: POLICY_VERSION,
      reasonCode: policyResult.reasonCode,
      policyDecision: 'REJECTED',
      rejectionReason: policyResult.reasonCode,
      message: policyResult.message,
      txHash: null,
      ledgerResult: null
    });

    const schedule = getScheduleById(scheduleId);
    if (
      schedule &&
      !['VERIFIED', 'PROCESSING'].includes(schedule.status) &&
      !schedule.txHash
    ) {
      updateSchedule(scheduleId, {
        status: 'REJECTED',
        rejectionReason: policyResult.reasonCode
      });
    }

    return {
      approved: false,
      executed: false,
      decisionId,
      policyVersion: POLICY_VERSION,
      reasonCode: policyResult.reasonCode,
      message: policyResult.message
    };
  }

  // Step 2: Lock schedule status to avoid race conditions
  updateSchedule(scheduleId, { status: 'PROCESSING' });

  const beneficiary = getBeneficiaryById(studentId);

  // Step 3: Forward approved request to XRPL Transaction Service
  console.log(`[Policy Engine] APPROVED payment for ${studentId}. Forwarding to XRPL Transaction Service...`);
  let txResult;
  try {
    txResult = await executePayment({
      destinationAddress: beneficiary.walletAddress,
      amountXRP: amount,
      reference: `${scheduleId}:${studentId}`
    });
  } catch (error) {
    // Network drop, faucet exhaustion, or a tec/tem result thrown by submitAndWait.
    // Never leave the schedule locked in PROCESSING with no audit record.
    console.error(`[Policy Engine] Ledger execution threw for ${scheduleId}: ${error.message}`);
    txResult = {
      success: false,
      error: error.message,
      resultCode: (error.data && error.data.result && error.data.result.meta && error.data.result.meta.TransactionResult) || 'SUBMISSION_ERROR',
      txHash: (error.data && error.data.result && error.data.result.hash) || null
    };
  }

  if (txResult.success) {
    // Step 4A: Deduct budget and finalize verified status
    updateProgrammeBudget(programmeId, amount);
    
    updateSchedule(scheduleId, {
      status: 'VERIFIED',
      txHash: txResult.txHash,
      rejectionReason: null
    });

    addAuditLog({
      eventType: 'DISBURSEMENT_SUCCESS',
      programmeId,
      studentId,
      scheduleId,
      amount,
      decisionId,
      policyVersion: POLICY_VERSION,
      reasonCode: null,
      policyDecision: 'APPROVED',
      rejectionReason: null,
      txHash: txResult.txHash,
      ledgerResult: txResult.resultCode,
      explorerUrl: txResult.explorerUrl
    });

    return {
      approved: true,
      executed: true,
      decisionId,
      policyVersion: POLICY_VERSION,
      reasonCode: null,
      txHash: txResult.txHash,
      explorerUrl: txResult.explorerUrl,
      ledgerIndex: txResult.ledgerIndex
    };
  } else {
    // Step 4B: Handle ledger failure
    updateSchedule(scheduleId, {
      status: 'FAILED',
      rejectionReason: txResult.error
    });

    addAuditLog({
      eventType: 'LEDGER_EXECUTION_FAILURE',
      programmeId,
      studentId,
      scheduleId,
      amount,
      decisionId,
      policyVersion: POLICY_VERSION,
      reasonCode: POLICY_ERRORS.LEDGER_EXECUTION_FAILED,
      policyDecision: 'APPROVED',
      rejectionReason: txResult.error,
      txHash: txResult.txHash,
      ledgerResult: txResult.resultCode || 'FAILED'
    });

    return {
      approved: true,
      executed: false,
      decisionId,
      policyVersion: POLICY_VERSION,
      reasonCode: POLICY_ERRORS.LEDGER_EXECUTION_FAILED,
      error: txResult.error
    };
  }
}

module.exports = {
  POLICY_ERRORS,
  POLICY_VERSION,
  isValidXrplAddress,
  evaluatePolicy,
  processDisbursement
};
