/**
 * FundFlow Autonomous AI Disbursement Agent
 * 
 * Responsibilities:
 * 1. Discovers eligible scheduled disbursements without human intervention.
 * 2. Prepares payment proposals.
 * 3. Submits proposals to the Independent Policy Engine.
 * 4. Reports verified results.
 * 
 * Notice: The agent does NOT have access to wallet seeds or private keys.
 * It cannot override policy decisions.
 */

const { getPendingSchedules, getBeneficiaryById, state } = require('../data/store');
const { processDisbursement } = require('../policy/policyEngine');
const { createAndFundStudentWallet } = require('../xrpl/xrplClient');

class DisbursementAgent {
  constructor() {
    this.agentName = "FundFlow Autonomous Agent v1.0";
    this.status = "IDLE";
  }

  /**
   * Run one autonomous disbursement evaluation cycle
   */
  async runCycle() {
    this.status = "RUNNING";
    const cycleId = `CYC-${Date.now()}`;
    console.log(`\n[Agent] Starting autonomous disbursement cycle: ${cycleId}...`);

    // 1. Ensure all active students have Testnet wallets for the demo
    for (const b of state.beneficiaries) {
      if (!b.walletAddress) {
        console.log(`[Agent] Provisioning Testnet wallet for student ${b.studentId} (${b.fullName})...`);
        try {
          const w = await createAndFundStudentWallet();
          b.walletAddress = w.address;
          b.walletSeed = w.seed;
          b.updatedAt = new Date().toISOString();
          console.log(`[Agent] Assigned wallet ${b.walletAddress} to ${b.studentId}`);
        } catch (e) {
          console.error(`[Agent] Failed to provision wallet for ${b.studentId}:`, e.message);
        }
      }
    }

    // 2. Discover due scheduled payments
    const pending = getPendingSchedules();
    console.log(`[Agent] Discovered ${pending.length} pending scheduled payment(s).`);

    const cycleResults = [];

    for (const schedule of pending) {
      console.log(`[Agent] Evaluating schedule ${schedule.scheduleId} for Student ${schedule.studentId}...`);

      const proposal = {
        programmeId: schedule.programmeId,
        studentId: schedule.studentId,
        amount: schedule.amount,
        scheduleId: schedule.scheduleId
      };

      // 3. Submit proposal to Independent Policy Engine
      const decision = await processDisbursement(proposal);
      const status = decision.approved
        ? decision.executed
          ? 'APPROVED_AND_EXECUTED'
          : 'LEDGER_FAILED'
        : 'REJECTED_BY_POLICY';

      cycleResults.push({
        id: schedule.id || schedule._id || schedule.scheduleId,
        _id: schedule.id || schedule._id || schedule.scheduleId,
        scheduleId: schedule.scheduleId,
        studentId: schedule.studentId,
        period: schedule.period || "November 2026",
        amount: schedule.amount,
        currency: 'XRP',
        updatedAt: schedule.updatedAt || new Date().toISOString(),
        status,
        reasonCode: decision.reasonCode || null,
        decisionId: decision.decisionId || null,
        policyVersion: decision.policyVersion || null,
        txHash: decision.txHash || null,
        decision
      });
    }

    this.status = "IDLE";
    console.log(`[Agent] Completed cycle ${cycleId}. Processed ${cycleResults.length} item(s).\n`);

    return {
      success: true,
      cycleId,
      processedCount: cycleResults.length,
      timestamp: new Date().toISOString(),
      results: cycleResults
    };
  }
}

const agentInstance = new DisbursementAgent();

module.exports = {
  agentInstance
};
