/**
 * Milestone 2 Automated Verification Test Suite
 * 
 * Verifies:
 * 1. Live XRPL Testnet connection and wallet auto-funding
 * 2. Autonomous payment execution on XRPL Testnet with tesSUCCESS verification
 * 3. Independent Policy Engine blocking:
 *    - Duplicate payments (Idempotency)
 *    - Allowance limit exceedance
 *    - Unauthorized beneficiaries
 *    - Admin emergency pause kill switch
 */

const { getXRPLClient, getAdminWallet, createAndFundStudentWallet, disconnectXRPL } = require('../src/xrpl/xrplClient');
const { evaluatePolicy, processDisbursement, POLICY_ERRORS } = require('../src/policy/policyEngine');
const { state, getScheduleById, getProgrammeById, setProgrammePause } = require('../src/data/store');

async function runTestSuite() {
  console.log('================================================================');
  console.log(' FundFlow — Milestone 2: XRPL & Policy Engine Verification Suite');
  console.log('================================================================\n');

  try {
    // Phase 1: XRPL Testnet Connection & Wallet Setup
    console.log('[Setup 1/2] Connecting to XRPL Testnet...');
    await getXRPLClient();

    console.log('[Setup 2/2] Funding Admin and Student Wallets via Testnet Faucet...');
    const adminWallet = await getAdminWallet();
    console.log(`✓ Admin Wallet Ready: ${adminWallet.address}`);

    const studentWallet = await createAndFundStudentWallet();
    console.log(`✓ Student (STU-001) Wallet Ready: ${studentWallet.address}`);

    // Assign student's wallet address in data store
    const student1 = state.beneficiaries.find(b => b.studentId === 'STU-001');
    student1.walletAddress = studentWallet.address;

    console.log('\n--- STARTING TEST SCENARIOS ---\n');

    // TEST 1: Happy Path - Valid Disbursement on XRPL Testnet
    console.log('▶ TEST 1: Valid Autonomous Student Disbursement on XRPL Testnet');
    const validProposal = {
      programmeId: 'PRG-WTC-2026',
      studentId: 'STU-001',
      amount: 10,
      scheduleId: 'SCH-NOV-001'
    };

    const test1Result = await processDisbursement(validProposal);
    console.log('Test 1 Execution Result:', test1Result);

    if (test1Result.approved && test1Result.executed && test1Result.txHash) {
      console.log(`✅ TEST 1 PASSED: Verified XRPL Tx Hash: ${test1Result.txHash}`);
      console.log(`   Explorer Link: ${test1Result.explorerUrl}`);
    } else {
      throw new Error(`TEST 1 FAILED: Expected approval and ledger execution, got: ${JSON.stringify(test1Result)}`);
    }

    // Verify state updates
    const updatedSchedule = getScheduleById('SCH-NOV-001');
    if (updatedSchedule.status !== 'VERIFIED' || !updatedSchedule.txHash) {
      throw new Error('TEST 1 State Verification Failed: Schedule was not marked as VERIFIED');
    }
    console.log('✓ State Check: Schedule status marked VERIFIED with TxHash attached.');

    // TEST 2: Duplicate Payment Block (Double-Dipping Attack)
    console.log('\n▶ TEST 2: Replay / Duplicate Payment Attempt (Should be BLOCKED by Policy)');
    const test2Result = await processDisbursement(validProposal);
    console.log('Test 2 Policy Decision:', test2Result);

    if (!test2Result.approved && test2Result.reasonCode === POLICY_ERRORS.DUPLICATE_PAYMENT) {
      console.log(`✅ TEST 2 PASSED: Policy Engine BLOCKED duplicate payment with code: ${test2Result.reasonCode}`);
    } else {
      throw new Error(`TEST 2 FAILED: Expected ERR_DUPLICATE_PAYMENT, got: ${JSON.stringify(test2Result)}`);
    }

    // TEST 3: Allowance Limit Exceeded Block
    console.log('\n▶ TEST 3: Payment Exceeding Student Allowance Limit (Should be BLOCKED)');
    const overBudgetProposal = {
      programmeId: 'PRG-WTC-2026',
      studentId: 'STU-001',
      amount: 50, // Allowance is 10
      scheduleId: 'SCH-NOV-002'
    };
    const test3Result = await processDisbursement(overBudgetProposal);
    console.log('Test 3 Policy Decision:', test3Result);

    if (!test3Result.approved && test3Result.reasonCode === POLICY_ERRORS.EXCEEDS_STUDENT_CAP) {
      console.log(`✅ TEST 3 PASSED: Policy Engine BLOCKED over-allowance payment with code: ${test3Result.reasonCode}`);
    } else {
      throw new Error(`TEST 3 FAILED: Expected ERR_EXCEEDS_STUDENT_ALLOWANCE_CAP, got: ${JSON.stringify(test3Result)}`);
    }

    // TEST 4: Unauthorized Beneficiary Block
    console.log('\n▶ TEST 4: Payment to Unauthorized / Unregistered Beneficiary (Should be BLOCKED)');
    const unauthorizedProposal = {
      programmeId: 'PRG-WTC-2026',
      studentId: 'STU-GHOST-999',
      amount: 10,
      scheduleId: 'SCH-NOV-003'
    };
    const test4Result = await processDisbursement(unauthorizedProposal);
    console.log('Test 4 Policy Decision:', test4Result);

    if (!test4Result.approved && test4Result.reasonCode === POLICY_ERRORS.UNAUTHORIZED_BENEFICIARY) {
      console.log(`✅ TEST 4 PASSED: Policy Engine BLOCKED ghost student with code: ${test4Result.reasonCode}`);
    } else {
      throw new Error(`TEST 4 FAILED: Expected ERR_UNAUTHORIZED_BENEFICIARY, got: ${JSON.stringify(test4Result)}`);
    }

    // TEST 5: Admin Emergency Pause (Kill Switch) Block
    console.log('\n▶ TEST 5: Payout under Paused Mandate / CFO Kill Switch (Should be BLOCKED)');
    setProgrammePause('PRG-WTC-2026', true);
    console.log('✓ CFO activated Emergency Pause on programme PRG-WTC-2026');

    // Create a new fresh schedule to test pause
    state.schedules.push({
      scheduleId: 'SCH-NOV-004',
      studentId: 'STU-001',
      programmeId: 'PRG-WTC-2026',
      period: 'December 2026',
      amount: 10,
      status: 'PENDING',
      txHash: null
    });

    const test5Result = await processDisbursement({
      programmeId: 'PRG-WTC-2026',
      studentId: 'STU-001',
      amount: 10,
      scheduleId: 'SCH-NOV-004'
    });
    console.log('Test 5 Policy Decision:', test5Result);

    if (!test5Result.approved && test5Result.reasonCode === POLICY_ERRORS.PROGRAMME_PAUSED) {
      console.log(`✅ TEST 5 PASSED: Policy Engine BLOCKED payout due to emergency pause: ${test5Result.reasonCode}`);
    } else {
      throw new Error(`TEST 5 FAILED: Expected ERR_PROGRAMME_PAUSED, got: ${JSON.stringify(test5Result)}`);
    }

    // Print Final Audit Summary
    console.log('\n================================================================');
    console.log(' ALL 5 TESTS PASSED WITH 100% SUCCESS RATE');
    console.log(` Total Audit Trail Logs Generated: ${state.auditLogs.length}`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ TEST SUITE RUNTIME ERROR:', err);
    process.exitCode = 1;
  } finally {
    await disconnectXRPL();
  }
}

runTestSuite();
