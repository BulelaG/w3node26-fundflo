/**
 * Autonomous agent - offline unit tests (concurrency guard, seed hygiene).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Stub XRPL modules so nothing touches the network.
function stubModule(rel, exportsObj) {
  const p = require.resolve(path.join(__dirname, rel));
  require.cache[p] = { id: p, filename: p, loaded: true, exports: exportsObj };
}

let resolveInFlight;
stubModule('../src/xrpl/transactionService.js', {
  executePayment: () =>
    new Promise((resolve) => {
      resolveInFlight = () =>
        resolve({ success: true, resultCode: 'tesSUCCESS', txHash: 'AB'.repeat(32), ledgerIndex: 1, fee: '0.000012', explorerUrl: 'x' });
    })
});
stubModule('../src/xrpl/xrplClient.js', {
  createAndFundStudentWallet: async () => ({ address: 'rURwsLT8PE77J4pMDUqHArD9n3w3mTANpv', seed: 'sSECRET', balance: 100 })
});

const store = require('../src/data/store');
const { agentInstance } = require('../src/agent/disbursementAgent');

test.beforeEach(() => store.resetStore());

test('second trigger while a cycle is running is rejected with 409 and status recovers', async () => {
  const first = agentInstance.runCycle();
  await new Promise((r) => setImmediate(r));
  assert.equal(agentInstance.status, 'RUNNING');

  await assert.rejects(agentInstance.runCycle(), (err) => err.status === 409 && err.code === 'ERR_CYCLE_IN_PROGRESS');

  // Release the three in-flight payments one by one.
  for (let i = 0; i < 3; i++) {
    resolveInFlight();
    await new Promise((r) => setImmediate(r));
  }
  const report = await first;
  assert.equal(report.success, true);
  assert.equal(report.processedCount, 3);
  assert.equal(agentInstance.status, 'IDLE');
});

test('agent provisions wallet address only and never persists a seed', async () => {
  store.addBeneficiary({ studentId: 'STU-NEW', fullName: 'New Student', programmeId: 'PRG-STEM-SA' });
  const b = store.getBeneficiaryById('STU-NEW');
  assert.equal(b.walletAddress, null);

  const run = agentInstance.runCycle();
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setImmediate(r));
    if (resolveInFlight) resolveInFlight();
  }
  await run;

  assert.equal(b.walletAddress, 'rURwsLT8PE77J4pMDUqHArD9n3w3mTANpv');
  assert.equal('walletSeed' in b, false);
  assert.equal(JSON.stringify(store.state).includes('sSECRET'), false);
});
