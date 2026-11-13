/**
 * FundFlow Data Store
 * In-memory state store with pre-seeded synthetic data.
 * Supports dynamic onboarding of programmes, beneficiaries, and schedules.
 */

function createInitialState() {
  const now = new Date().toISOString();
  const programmes = [
    {
      id: "PRG-WTC-2026",
      _id: "PRG-WTC-2026",
      name: "WeThinkCode Student Living Allowance Fund",
      sponsor: "National Tech Education Foundation",
      totalBudget: 50000,
      remainingBudget: 50000,
      currency: "XRP",
      isPaused: false,
      beneficiaries: ["STU-001", "STU-002", "STU-003"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "PRG-STEM-SA",
      _id: "PRG-STEM-SA",
      name: "South Africa STEM bursary & Laptop Fund",
      sponsor: "African Technology Bursary Trust",
      totalBudget: 25000,
      remainingBudget: 25000,
      currency: "XRP",
      isPaused: false,
      beneficiaries: [],
      createdAt: now,
      updatedAt: now
    }
  ];
  const beneficiaries = [
    {
      id: "STU-001",
      _id: "STU-001",
      studentId: "STU-001",
      fullName: "Sipho Dlamini",
      institution: "WeThinkCode Cape Town",
      monthlyAllowance: 10, // 10 XRP stipend (~R1,650)
      currency: "XRP",
      walletAddress: null,
      walletSeed: null,
      status: "ACTIVE",
      programmeId: "PRG-WTC-2026",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "STU-002",
      _id: "STU-002",
      studentId: "STU-002",
      fullName: "Naledi Khumalo",
      institution: "WeThinkCode Johannesburg",
      monthlyAllowance: 10,
      currency: "XRP",
      walletAddress: null,
      walletSeed: null,
      status: "ACTIVE",
      programmeId: "PRG-WTC-2026",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "STU-003",
      _id: "STU-003",
      studentId: "STU-003",
      fullName: "Thabo Molefe",
      institution: "WeThinkCode Durban",
      monthlyAllowance: 10,
      currency: "XRP",
      walletAddress: null,
      walletSeed: null,
      status: "ACTIVE",
      programmeId: "PRG-WTC-2026",
      createdAt: now,
      updatedAt: now
    }
  ];
  const schedules = [
    {
      id: "SCH-NOV-001",
      _id: "SCH-NOV-001",
      scheduleId: "SCH-NOV-001",
      studentId: "STU-001",
      programmeId: "PRG-WTC-2026",
      period: "November 2026",
      amount: 10,
      currency: "XRP",
      status: "PENDING",
      txHash: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "SCH-NOV-002",
      _id: "SCH-NOV-002",
      scheduleId: "SCH-NOV-002",
      studentId: "STU-002",
      programmeId: "PRG-WTC-2026",
      period: "November 2026",
      amount: 10,
      currency: "XRP",
      status: "PENDING",
      txHash: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "SCH-NOV-003",
      _id: "SCH-NOV-003",
      scheduleId: "SCH-NOV-003",
      studentId: "STU-003",
      programmeId: "PRG-WTC-2026",
      period: "November 2026",
      amount: 10,
      currency: "XRP",
      status: "PENDING",
      txHash: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now
    }
  ];

  return { programmes, beneficiaries, schedules, auditLogs: [] };
}

const state = createInitialState();

function resetStore() {
  const initialState = createInitialState();
  state.programmes.splice(0, state.programmes.length, ...initialState.programmes);
  state.beneficiaries.splice(0, state.beneficiaries.length, ...initialState.beneficiaries);
  state.schedules.splice(0, state.schedules.length, ...initialState.schedules);
  state.auditLogs.splice(0, state.auditLogs.length);
  return state;
}

// Store Helper Methods
const getProgrammes = () => state.programmes;
const getProgrammeById = (id) => state.programmes.find(p => p.id === id);

const addProgramme = (prog) => {
  const id = prog.id || `PRG-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const newProg = {
    id,
    _id: id,
    name: prog.name,
    sponsor: prog.sponsor || "Education Bursary Fund",
    totalBudget: parseFloat(prog.totalBudget) || 10000,
    remainingBudget: parseFloat(prog.totalBudget) || 10000,
    currency: "XRP",
    isPaused: false,
    beneficiaries: [],
    createdAt: now,
    updatedAt: now
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
    p.updatedAt = new Date().toISOString();
  }
  return p;
};

const getBeneficiaries = () => state.beneficiaries;
const getBeneficiaryById = (studentId) => state.beneficiaries.find(b => b.studentId === studentId);

const addBeneficiary = (data) => {
  const studentId = data.studentId || `STU-${Date.now().toString().slice(-3)}`;
  const now = new Date().toISOString();
  const student = {
    id: studentId,
    _id: studentId,
    studentId,
    fullName: data.fullName,
    institution: data.institution || "WeThinkCode",
    monthlyAllowance: parseFloat(data.monthlyAllowance) || 10,
    currency: "XRP",
    walletAddress: data.walletAddress || null,
    walletSeed: data.walletSeed || null,
    status: "ACTIVE",
    programmeId: data.programmeId || "PRG-WTC-2026",
    createdAt: now,
    updatedAt: now
  };

  state.beneficiaries.push(student);

  // Link to programme whitelist
  const prog = getProgrammeById(student.programmeId);
  if (prog && !prog.beneficiaries.includes(student.studentId)) {
    prog.beneficiaries.push(student.studentId);
  }

  // Create an initial scheduled payment for them
  const scheduleId = `SCH-${Date.now().toString().slice(-6)}`;
  const schedule = {
    id: scheduleId,
    _id: scheduleId,
    scheduleId,
    studentId: student.studentId,
    programmeId: student.programmeId,
    period: "November 2026",
    amount: student.monthlyAllowance,
    currency: "XRP",
    status: "PENDING",
    txHash: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now
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
    b.updatedAt = new Date().toISOString();
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
    programme.updatedAt = new Date().toISOString();
  }
  return programme;
};

const setProgrammePause = (programmeId, isPaused) => {
  const programme = getProgrammeById(programmeId);
  if (programme) {
    programme.isPaused = isPaused;
    programme.updatedAt = new Date().toISOString();
  }
  return programme;
};

module.exports = {
  state,
  resetStore,
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
