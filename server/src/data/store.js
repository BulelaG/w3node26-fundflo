/**
 * FundFlow Data Store
 * In-memory state store with pre-seeded synthetic data.
 * Supports dynamic onboarding of programmes, beneficiaries, and schedules.
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
    },
    {
      id: "PRG-STEM-SA",
      name: "South Africa STEM bursary & Laptop Fund",
      sponsor: "African Technology Bursary Trust",
      totalBudget: 25000,
      remainingBudget: 25000,
      currency: "XRP",
      isPaused: false,
      beneficiaries: [],
      createdAt: new Date().toISOString()
    }
  ],

  beneficiaries: [
    {
      studentId: "STU-001",
      fullName: "Sipho Dlamini",
      institution: "WeThinkCode Cape Town",
      monthlyAllowance: 10, // 10 XRP stipend (~R1,650)
      walletAddress: null,
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
      status: "PENDING",
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

const addProgramme = (prog) => {
  const newProg = {
    id: prog.id || `PRG-${Date.now().toString().slice(-4)}`,
    name: prog.name,
    sponsor: prog.sponsor || "Education Bursary Fund",
    totalBudget: parseFloat(prog.totalBudget) || 10000,
    remainingBudget: parseFloat(prog.totalBudget) || 10000,
    currency: "XRP",
    isPaused: false,
    beneficiaries: [],
    createdAt: new Date().toISOString()
  };
  state.programmes.push(newProg);
  return newProg;
};

const updateProgramme = (id, updates) => {
  const p = getProgrammeById(id);
  if (p) {
    if (updates.name) p.name = updates.name;
    if (updates.totalBudget) {
      const diff = parseFloat(updates.totalBudget) - p.totalBudget;
      p.totalBudget = parseFloat(updates.totalBudget);
      p.remainingBudget += diff;
    }
  }
  return p;
};

const getBeneficiaries = () => state.beneficiaries;
const getBeneficiaryById = (studentId) => state.beneficiaries.find(b => b.studentId === studentId);

const addBeneficiary = (data) => {
  const student = {
    studentId: data.studentId || `STU-${Date.now().toString().slice(-3)}`,
    fullName: data.fullName,
    institution: data.institution || "WeThinkCode",
    monthlyAllowance: parseFloat(data.monthlyAllowance) || 10,
    walletAddress: data.walletAddress || null,
    walletSeed: data.walletSeed || null,
    status: "ACTIVE",
    programmeId: data.programmeId || "PRG-WTC-2026"
  };

  state.beneficiaries.push(student);

  // Link to programme whitelist
  const prog = getProgrammeById(student.programmeId);
  if (prog && !prog.beneficiaries.includes(student.studentId)) {
    prog.beneficiaries.push(student.studentId);
  }

  // Create an initial scheduled payment for them
  const schedule = {
    scheduleId: `SCH-${Date.now().toString().slice(-6)}`,
    studentId: student.studentId,
    programmeId: student.programmeId,
    period: "November 2026",
    amount: student.monthlyAllowance,
    status: "PENDING",
    txHash: null,
    rejectionReason: null,
    updatedAt: new Date().toISOString()
  };
  state.schedules.push(schedule);

  return student;
};

const updateBeneficiary = (studentId, updates) => {
  const b = getBeneficiaryById(studentId);
  if (b) {
    if (updates.monthlyAllowance !== undefined) {
      b.monthlyAllowance = parseFloat(updates.monthlyAllowance);
    }
    if (updates.status) b.status = updates.status;
    if (updates.walletAddress) b.walletAddress = updates.walletAddress;
  }
  return b;
};

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
  addProgramme,
  updateProgramme,
  getBeneficiaries,
  getBeneficiaryById,
  addBeneficiary,
  updateBeneficiary,
  getSchedules,
  getScheduleById,
  getPendingSchedules,
  getAuditLogs,
  addAuditLog,
  updateSchedule,
  updateProgrammeBudget,
  setProgrammePause
};
