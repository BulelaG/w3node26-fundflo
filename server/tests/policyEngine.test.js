/**
 * Independent Policy Engine - offline unit tests.
 *
 * Runs with the built-in Node test runner, no network, no XRPL Testnet.
 * The XRPL transaction service is stubbed through the require cache so we can
 * exercise every policy branch plus the ledger-failure recovery path in milliseconds.
 *
 *   npm test
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// ---- Stub the XRPL transaction service BEFORE the policy engine loads it ----
const txServicePath = require.resolve(path.join(__dirname, '../src/xrpl/transactionService.js'));
const stub = { mode: 'success', calls: [] };
require.cache[txServicePath] = {
  id: txServicePath,
  filename: txServicePath,
  loaded: true,
  exports: {
    async executePayment(params) {
      stub.calls.push(params);
      if (stub.mode === 'throw') {
        const err = new Error('XRPL Submission Failed: Transaction failed, tecUNFUNDED_PAYMENT');
        err.data = { result: { hash: 'DEADBEEF'.repeat(8), meta: { TransactionResult: 'tecUNFUNDED_PAYMENT' } } };
        throw err;
      }
      if (stub.mode === 'tec') {
        return { success: false, resultCode: 'tecPATH_DRY', txHash: 'CAFEBABE'.repeat(8), error: 'tecPATH_DRY' };
      }
      return {
        success: true,
        resultCode: 'tesSUCCESS',
        txHash: 'ABCDEF12'.repeat(8),
        ledgerIndex: 1234567,
        fee: '0.000012',
        explorerUrl: 'https://testnet.xrpl.org/transactions/' + 'ABCDEF12'.repeat(8)
      };
    }
  }
};

const store = require('../src/data/store');
const {
  POLICY_ERRORS,
  evaluatePolicy,
  processDisbursement,
  isValidXrplAddress
} = require('../src/policy/policyEngine');

const VALID = { programmeId: 'PRG-WTC-2026', studentId: 'STU-001', amount: 10, scheduleId: 'SCH-NOV-001' };

test.beforeEach(() => {
  store.resetStore();
  stub.mode = 'success';
  stub.calls.length = 0;
});

// ---------------------------------------------------------------- evaluatePolicy

test('happy path clears all policy checks', () => {
  const r = evaluatePolicy(VALID);
  assert.equal(r.isValid, true);
  assert.equal(r.reasonCode, null);
});

test('rejects non-numeric, NaN, zero and negative amounts', () => {
  for (const amount of ['10', 'abc', NaN, 0, -5, Infinity, undefined, null]) {
    const r = evaluatePolicy({ ...VALID, amount });
    assert.equal(r.isValid, false, `amount ${String(amount)} should be rejected`);
    assert.equal(r.reasonCode, POLICY_ERRORS.INVALID_AMOUNT);
  }
});

test('rejects unknown programme', () => {
  const r = evaluatePolicy({ ...VALID, programmeId: 'PRG-NOPE' });
  assert.equal(r.reasonCode, POLICY_ERRORS.PROGRAMME_NOT_FOUND);
});

test('kill switch: paused programme blocks every payout', () => {
  store.setProgrammePause('PRG-WTC-2026', true);
  const r = evaluatePolicy(VALID);
  assert.equal(r.reasonCode, POLICY_ERRORS.PROGRAMME_PAUSED);
});

test('rejects student not on the programme whitelist', () => {
  store.addBeneficiary({ studentId: 'STU-OUT', fullName: 'Outsider', programmeId: 'PRG-STEM-SA' });
  const r = evaluatePolicy({ ...VALID, studentId: 'STU-OUT' });
  assert.equal(r.reasonCode, POLICY_ERRORS.UNAUTHORIZED_BENEFICIARY);
});

test('rejects inactive beneficiary', () => {
  store.updateBeneficiary('STU-001', { status: 'SUSPENDED' });
  const r = evaluatePolicy(VALID);
  assert.equal(r.reasonCode, POLICY_ERRORS.BENEFICIARY_INACTIVE);
});

test('rejects beneficiary with missing or malformed wallet', () => {
  const b = store.getBeneficiaryById('STU-001');
  b.walletAddress = null;
  assert.equal(evaluatePolicy(VALID).reasonCode, POLICY_ERRORS.MISSING_WALLET);
  b.walletAddress = 'rNOTAVALIDADDRESS0OIl';
  assert.equal(evaluatePolicy(VALID).reasonCode, POLICY_ERRORS.MISSING_WALLET);
});

test('rejects amount above the student monthly cap', () => {
  const r = evaluatePolicy({ ...VALID, amount: 50 });
  assert.equal(r.reasonCode, POLICY_ERRORS.EXCEEDS_STUDENT_CAP);
});

test('rejects when programme budget is exhausted', () => {
  store.updateBeneficiary('STU-001', { monthlyAllowance: 100000 });
  const r = evaluatePolicy({ ...VALID, amount: 60000 });
  assert.equal(r.reasonCode, POLICY_ERRORS.INSUFFICIENT_BUDGET);
});

test('rejects unknown schedule', () => {
  const r = evaluatePolicy({ ...VALID, scheduleId: 'SCH-NOPE' });
  assert.equal(r.reasonCode, POLICY_ERRORS.SCHEDULE_NOT_FOUND);
});

test('duplicate guard: VERIFIED and PROCESSING schedules are blocked', () => {
  store.updateSchedule('SCH-NOV-001', { status: 'VERIFIED', txHash: 'X'.repeat(64) });
  assert.equal(evaluatePolicy(VALID).reasonCode, POLICY_ERRORS.DUPLICATE_PAYMENT);
  store.updateSchedule('SCH-NOV-001', { status: 'PROCESSING', txHash: null });
  assert.equal(evaluatePolicy(VALID).reasonCode, POLICY_ERRORS.DUPLICATE_PAYMENT);
});

test('isValidXrplAddress accepts classic addresses and rejects junk', () => {
  assert.equal(isValidXrplAddress('rURwsLT8PE77J4pMDUqHArD9n3w3mTANpv'), true);
  assert.equal(isValidXrplAddress('r'), false);
  assert.equal(isValidXrplAddress('xURwsLT8PE77J4pMDUqHArD9n3w3mTANpv'), false);
  assert.equal(isValidXrplAddress(undefined), false);
});

// ---------------------------------------------------------------- processDisbursement

test('approved payment deducts budget, marks VERIFIED, writes audit log', async () => {
  const r = await processDisbursement(VALID);
  assert.equal(r.approved, true);
  assert.equal(r.executed, true);
  assert.match(r.txHash, /^[A-F0-9]{64}$/);
  assert.equal(store.getProgrammeById('PRG-WTC-2026').remainingBudget, 49990);
  assert.equal(store.getScheduleById('SCH-NOV-001').status, 'VERIFIED');
  const log = store.getAuditLogs()[0];
  assert.equal(log.eventType, 'DISBURSEMENT_SUCCESS');
  assert.equal(log.policyDecision, 'APPROVED');
  assert.equal(stub.calls.length, 1);
  assert.equal(stub.calls[0].destinationAddress, 'rURwsLT8PE77J4pMDUqHArD9n3w3mTANpv');
});

test('replaying an approved payment is blocked and never reaches the ledger', async () => {
  await processDisbursement(VALID);
  const r = await processDisbursement(VALID);
  assert.equal(r.approved, false);
  assert.equal(r.reasonCode, POLICY_ERRORS.DUPLICATE_PAYMENT);
  assert.equal(stub.calls.length, 1, 'ledger must only be called once');
  assert.equal(store.getProgrammeById('PRG-WTC-2026').remainingBudget, 49990);
});

test('policy rejection marks schedule REJECTED and logs reason code', async () => {
  const r = await processDisbursement({ ...VALID, amount: 50 });
  assert.equal(r.approved, false);
  assert.equal(store.getScheduleById('SCH-NOV-001').status, 'REJECTED');
  assert.equal(store.getScheduleById('SCH-NOV-001').rejectionReason, POLICY_ERRORS.EXCEEDS_STUDENT_CAP);
  assert.equal(store.getAuditLogs()[0].eventType, 'POLICY_REJECTION');
  assert.equal(stub.calls.length, 0);
});

test('ledger THROW does not leave schedule stuck in PROCESSING and does not deduct budget', async () => {
  stub.mode = 'throw';
  const r = await processDisbursement(VALID);
  assert.equal(r.approved, true);
  assert.equal(r.executed, false);
  assert.equal(r.reasonCode, POLICY_ERRORS.LEDGER_EXECUTION_FAILED);
  const sched = store.getScheduleById('SCH-NOV-001');
  assert.equal(sched.status, 'FAILED');
  assert.notEqual(sched.status, 'PROCESSING');
  assert.equal(store.getProgrammeById('PRG-WTC-2026').remainingBudget, 50000);
  const log = store.getAuditLogs()[0];
  assert.equal(log.eventType, 'LEDGER_EXECUTION_FAILURE');
  assert.equal(log.ledgerResult, 'tecUNFUNDED_PAYMENT');
});

test('ledger non-tes result is recorded as FAILED with the result code', async () => {
  stub.mode = 'tec';
  const r = await processDisbursement(VALID);
  assert.equal(r.executed, false);
  assert.equal(store.getScheduleById('SCH-NOV-001').status, 'FAILED');
  assert.equal(store.getAuditLogs()[0].ledgerResult, 'tecPATH_DRY');
});

test('a FAILED schedule can be retried once the ledger recovers', async () => {
  stub.mode = 'throw';
  await processDisbursement(VALID);
  stub.mode = 'success';
  const r = await processDisbursement(VALID);
  assert.equal(r.executed, true);
  assert.equal(store.getScheduleById('SCH-NOV-001').status, 'VERIFIED');
});
