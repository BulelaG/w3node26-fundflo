/**
 * FundFlow Data Store
 * In-memory state store with pre-seeded synthetic data.
 * Compatible with standalone testing and easily backed by MongoDB.
 */

const state = {
  programmes: [
    {
      id: "PRG-WTC-2026",
      name: "WeThinkCode Student Living Allowance Fund",
      sponsor: "National Tech Education Foundation",
      totalBudget: 50000,
      remainingBudget: 50000,
      currency: "XRP",
      isPaused: false,
      beneficiaries: ["STU-001", "STU-002", "STU-003"],
      createdAt: new Date().toISOString()
    }
  ],

  beneficiaries: [
    {
      studentId: "STU-001",
      fullName: "Sipho Dlamini",
      institution: "WeThinkCode Cape Town",
      monthlyAllowance: 10, // 10 XRP for demo (represents living stipend)
      walletAddress: null,  // Will be assigned auto-funded XRPL Testnet wallet
      walletSeed: null,
      status: "ACTIVE",
      programmeId: "PRG-WTC-2026"
    },
    {
      studentId: "STU-002",
      fullName: "Naledi Khumalo",
      institution: "WeThinkCode Johannesburg",
      monthlyAllowance: 10,
      walletAddress: null,
      walletSeed: null,
      status: "ACTIVE",
      programmeId: "PRG-WTC-2026"
    },
    {
      studentId: "STU-003",
      fullName: "Thabo Molefe",
      institution: "WeThinkCode Durban",
      monthlyAllowance: 10,
      walletAddress: null,
      walletSeed: null,
      status: "ACTIVE",
      programmeId: "PRG-WTC-2026"
    }
  ],

  schedules: [
    {
      scheduleId: "SCH-NOV-001",
      studentId: "STU-001",
      programmeId: "PRG-WTC-2026",
      period: "November 2026",
      amount: 10,
      status: "PENDING", // PENDING, PROCESSING, VERIFIED, REJECTED
      txHash: null,
      rejectionReason: null,
      updatedAt: new Date().toISOString()
    },
    {
      scheduleId: "SCH-NOV-002",
      studentId: "STU-002",
      programmeId: "PRG-WTC-2026",
      period: "November 2026",
      amount: 10,
      status: "PENDING",
      txHash: null,
      rejectionReason: null,
      updatedAt: new Date().toISOString()
    },
    {
      scheduleId: "SCH-NOV-003",
      studentId: "STU-003",
      programmeId: "PRG-WTC-2026",
      period: "November 2026",
      amount: 10,
      status: "PENDING",
      txHash: null,
      rejectionReason: null,
      updatedAt: new Date().toISOString()
    }
  ],

  auditLogs: []
};

// Store Helper Methods
const getProgrammes = () => state.programmes;
const getProgrammeById = (id) => state.programmes.find(p => p.id === id);

const getBeneficiaries = () => state.beneficiaries;
const getBeneficiaryById = (studentId) => state.beneficiaries.find(b => b.studentId === studentId);

const getSchedules = () => state.schedules;
const getScheduleById = (scheduleId) => state.schedules.find(s => s.scheduleId === scheduleId);
const getPendingSchedules = () => state.schedules.filter(s => s.status === "PENDING");

const getAuditLogs = () => [...state.auditLogs].reverse();

const addAuditLog = (entry) => {
  const log = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };
  state.auditLogs.push(log);
  return log;
};

const updateSchedule = (scheduleId, updates) => {
  const schedule = getScheduleById(scheduleId);
  if (schedule) {
    Object.assign(schedule, updates, { updatedAt: new Date().toISOString() });
  }
  return schedule;
};

const updateProgrammeBudget = (programmeId, deduction) => {
  const programme = getProgrammeById(programmeId);
  if (programme) {
    programme.remainingBudget -= deduction;
  }
  return programme;
};

const setProgrammePause = (programmeId, isPaused) => {
  const programme = getProgrammeById(programmeId);
  if (programme) {
    programme.isPaused = isPaused;
  }
  return programme;
};

module.exports = {
  state,
  getProgrammes,
  getProgrammeById,
  getBeneficiaries,
  getBeneficiaryById,
  getSchedules,
  getScheduleById,
  getPendingSchedules,
  getAuditLogs,
  addAuditLog,
  updateSchedule,
  updateProgrammeBudget,
  setProgrammePause
};
