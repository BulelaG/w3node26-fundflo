export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

let apiMode = 'CONNECTING'
const mockEndpoints = new Set()
const offlineEndpoints = new Set()
const liveEndpoints = new Set()
const apiModeSubscribers = new Set()

function updateApiMode(endpoint, mode) {
  mockEndpoints.delete(endpoint)
  offlineEndpoints.delete(endpoint)
  liveEndpoints.delete(endpoint)

  if (mode === 'MOCK') mockEndpoints.add(endpoint)
  if (mode === 'OFFLINE') offlineEndpoints.add(endpoint)
  if (mode === 'LIVE') liveEndpoints.add(endpoint)

  const nextMode = offlineEndpoints.size
    ? 'OFFLINE'
    : mockEndpoints.size
      ? 'MOCK'
      : liveEndpoints.size
        ? 'LIVE'
        : 'CONNECTING'

  if (nextMode !== apiMode) {
    apiMode = nextMode
    apiModeSubscribers.forEach((subscriber) => subscriber())
  }
}

export function getApiMode() {
  return apiMode
}

export function subscribeToApiMode(subscriber) {
  apiModeSubscribers.add(subscriber)
  return () => apiModeSubscribers.delete(subscriber)
}

const mockTxHash = '43CDC252A0DFD39BEB8EC781DEFA08AA4D91A2406FF969C90A7CCA3CB991674E'

const mockData = {
  health: () => ({
    status: 'MOCK',
    service: 'FundFlow Backend Engine',
    environment: 'development',
    timestamp: new Date().toISOString(),
  }),
  programmes: () => [
    {
      _id: 'PRG-WTC-2026',
      id: 'PRG-WTC-2026',
      programmeId: 'PRG-WTC-2026',
      name: 'WeThinkCode Student Living Allowance Fund',
      sponsor: 'National Tech Education Foundation',
      totalBudget: 50000,
      remainingBudget: 49970,
      currency: 'XRP',
      isPaused: false,
      beneficiaries: ['STU-001', 'STU-002', 'STU-003'],
      createdAt: '2026-11-12T10:00:00.000Z',
    },
    {
      _id: 'PRG-STEM-SA',
      id: 'PRG-STEM-SA',
      programmeId: 'PRG-STEM-SA',
      name: 'South Africa STEM Bursary & Laptop Fund',
      sponsor: 'African Technology Bursary Trust',
      totalBudget: 25000,
      remainingBudget: 25000,
      currency: 'XRP',
      isPaused: false,
      beneficiaries: [],
      createdAt: '2026-11-12T10:00:00.000Z',
    }
  ],
  beneficiaries: () => [
    {
      studentId: 'STU-001',
      fullName: 'Sipho Dlamini',
      institution: 'WeThinkCode Cape Town',
      walletAddress: 'rUfjbcCNpfGduuSGs532cqDqh4wRGauunK',
      monthlyAllowance: 10,
      status: 'ACTIVE',
      programmeId: 'PRG-WTC-2026',
    },
    {
      studentId: 'STU-002',
      fullName: 'Naledi Khumalo',
      institution: 'WeThinkCode Johannesburg',
      walletAddress: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
      monthlyAllowance: 10,
      status: 'ACTIVE',
      programmeId: 'PRG-WTC-2026',
    },
    {
      studentId: 'STU-003',
      fullName: 'Thabo Molefe',
      institution: 'WeThinkCode Durban',
      walletAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6paa',
      monthlyAllowance: 10,
      status: 'ACTIVE',
      programmeId: 'PRG-WTC-2026',
    }
  ],
  schedules: () => [
    {
      scheduleId: 'SCH-NOV-001',
      studentId: 'STU-001',
      programmeId: 'PRG-WTC-2026',
      period: 'November 2026',
      amount: 10,
      status: 'VERIFIED',
      txHash: mockTxHash
    },
    {
      scheduleId: 'SCH-NOV-002',
      studentId: 'STU-002',
      programmeId: 'PRG-WTC-2026',
      period: 'November 2026',
      amount: 10,
      status: 'PENDING',
      txHash: null
    },
    {
      scheduleId: 'SCH-NOV-003',
      studentId: 'STU-003',
      programmeId: 'PRG-WTC-2026',
      period: 'November 2026',
      amount: 10,
      status: 'PENDING',
      txHash: null
    }
  ],
  studentStatus: (studentId) => ({
    studentId: studentId || 'STU-001',
    fullName: studentId === 'STU-002' ? 'Naledi Khumalo' : 'Sipho Dlamini',
    institution: 'WeThinkCode Cape Town',
    monthlyAllowance: 10,
    walletAddress: 'rUfjbcCNpfGduuSGs532cqDqh4wRGauunK',
    disbursements: [
      {
        scheduleId: 'SCH-NOV-001',
        period: 'November 2026',
        amount: 10,
        status: 'VERIFIED',
        txHash: mockTxHash,
        xrplExplorerUrl: `https://testnet.xrpl.org/transactions/${mockTxHash}`,
        updatedAt: '2026-11-12T16:45:00.000Z'
      }
    ]
  }),
  auditLogs: () => [
    {
      _id: 'LOG-001',
      id: 'LOG-001',
      timestamp: new Date().toISOString(),
      studentId: 'STU-001',
      programmeId: 'PRG-WTC-2026',
      amount: 10,
      policyDecision: 'APPROVED',
      rejectionReason: null,
      txHash: mockTxHash,
      ledgerResult: 'tesSUCCESS'
    },
    {
      _id: 'LOG-002',
      id: 'LOG-002',
      timestamp: new Date().toISOString(),
      studentId: 'STU-001',
      programmeId: 'PRG-WTC-2026',
      amount: 10,
      policyDecision: 'REJECTED',
      rejectionReason: 'ERR_DUPLICATE_PAYMENT',
      txHash: null,
      ledgerResult: null
    }
  ],
  auditSummary: () => ({
    totalAuditEvents: 2,
    verifiedDisbursements: 1,
    rejectedAttempts: 1
  }),
  analytics: () => ({
    totalAllocatedXRP: 50000,
    totalAllocatedZAR: 1250000,
    totalDisbursedXRP: 10,
    totalDisbursedZAR: 250,
    middlemanFeesSavedZAR: 145,
    leakageThwartedZAR: 2250,
    blockedAttemptsCount: 4,
    avgSettlementSeconds: 3.8,
    reconciliationRate: 100,
    institutionBreakdown: [
      { name: 'WeThinkCode Cape Town', students: 1, disbursedXRP: 10, disbursedZAR: 250 },
      { name: 'WeThinkCode Johannesburg', students: 1, disbursedXRP: 0, disbursedZAR: 0 },
      { name: 'WeThinkCode Durban', students: 1, disbursedXRP: 0, disbursedZAR: 0 }
    ]
  })
}

async function request(path, { method = 'GET', body, fallback } = {}) {
  const url = `${API_BASE_URL}${path}`
  const endpoint = `${method} ${path}`
  let response

  try {
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })
  } catch (error) {
    updateApiMode(endpoint, 'OFFLINE')
    if (fallback) return fallback()
    throw error
  }

  if (response.status === 404) {
    updateApiMode(endpoint, 'MOCK')
    console.warn(`[FundFlow API] ${method} ${path} returned 404; using mock fallback.`)
    if (fallback) return fallback()
  }

  if (!response.ok) {
    updateApiMode(endpoint, 'OFFLINE')
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`)
  }

  try {
    const data = await response.json()
    updateApiMode(endpoint, 'LIVE')
    return data
  } catch (error) {
    updateApiMode(endpoint, 'OFFLINE')
    if (fallback) return fallback()
    throw error
  }
}

// Named Exports for App.jsx
export function getHealth() {
  return request('/health', { fallback: mockData.health })
}

export function getProgrammes() {
  return request('/programmes', { fallback: mockData.programmes })
}

export function createProgramme(data) {
  return request('/programmes', { method: 'POST', body: data })
}

export function updateProgramme(id, data) {
  return request(`/programmes/${id}`, { method: 'PATCH', body: data })
}

export function toggleProgrammePause(id, programmeId, isPaused) {
  const targetId = id || programmeId || 'PRG-WTC-2026'
  return request(`/programmes/${targetId}/toggle-pause`, {
    method: 'PATCH',
    fallback: () => ({ message: 'Toggled pause', programmeId: targetId, isPaused: !isPaused })
  })
}

export function getBeneficiaries() {
  return request('/beneficiaries', { fallback: mockData.beneficiaries })
}

export function createBeneficiary(data) {
  return request('/beneficiaries', { method: 'POST', body: data })
}

export function updateBeneficiary(studentId, data) {
  return request(`/beneficiaries/${studentId}`, { method: 'PATCH', body: data })
}

export function getSchedules() {
  return request('/schedules', { fallback: mockData.schedules })
}

export function getAuditLogs() {
  return request('/audit-logs', { fallback: mockData.auditLogs })
}

export function getAuditSummary() {
  return request('/audit-summary', { fallback: mockData.auditSummary })
}

export function getAnalytics() {
  return request('/analytics', { fallback: mockData.analytics })
}

export function getAuditorExportUrl(format = 'csv') {
  return `${API_BASE_URL}/auditor/export?format=${format}`
}

export function triggerAgent() {
  return request('/agent/trigger', { method: 'POST', fallback: () => ({ processedCount: 1 }) })
}

export function triggerAgentCycle() {
  return triggerAgent()
}

export function getAgentStatus() {
  return request('/agent/status', { fallback: () => ({ status: 'STANDBY' }) })
}

export function getXrplAccountInfo(address) {
  return request(`/xrpl/account-info/${address}`, { fallback: () => ({ balanceXRP: 100 }) })
}

export function getXrplAdminWallet() {
  return request('/xrpl/admin-wallet', { fallback: () => ({ address: 'rLoL5k1M4RTAkvayLG6sWyCD49GdkeaQTJ', balanceXRP: 100, sequence: 1 }) })
}

export function getStudentStatus(studentId) {
  return request(`/students/${studentId}/status`, { fallback: () => mockData.studentStatus(studentId) })
}

export function claimStudentAllowance(studentId) {
  return request(`/students/${studentId}/claim`, { method: 'POST' })
}

export function validateAndPay(payload) {
  return request('/disbursements/validate-and-pay', { method: 'POST', body: payload })
}

// Default export object providing all functions for pages
export const api = {
  getHealth,
  getProgrammes,
  createProgramme,
  updateProgramme,
  togglePauseProgramme: toggleProgrammePause,
  toggleProgrammePause,
  getBeneficiaries,
  createBeneficiary,
  updateBeneficiary,
  getSchedules,
  getAuditLogs,
  getAuditSummary,
  getAnalytics,
  getAuditorExportUrl,
  triggerAgentCycle,
  triggerAgent,
  getAgentStatus,
  getXrplAccountInfo,
  getXrplAdminWallet,
  getStudentStatus,
  claimStudentAllowance,
  validateAndPay
}

export default api
