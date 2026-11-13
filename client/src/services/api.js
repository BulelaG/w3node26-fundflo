export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? '/api' : 'http://localhost:5000/api')
export const XRP_TO_ZAR_DEMO_RATE = 165

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

function getActiveUserRole() {
  if (typeof window === 'undefined') return ''

  try {
    const serializedSession = window.sessionStorage.getItem('ff_session')
    if (!serializedSession) return ''
    const session = JSON.parse(serializedSession)
    return typeof session.role === 'string' ? session.role : ''
  } catch {
    return ''
  }
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
  studentStatus: (studentId) => {
    const students = {
      'STU-001': {
        fullName: 'Sipho Dlamini',
        institution: 'WeThinkCode Cape Town',
        walletAddress: 'rUfjbcCNpfGduuSGs532cqDqh4wRGauunK',
      },
      'STU-002': {
        fullName: 'Naledi Khumalo',
        institution: 'WeThinkCode Johannesburg',
        walletAddress: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
      },
      'STU-003': {
        fullName: 'Thabo Molefe',
        institution: 'WeThinkCode Durban',
        walletAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6paa',
      },
    }
    const resolvedStudentId =
      studentId && Object.prototype.hasOwnProperty.call(students, studentId)
        ? studentId
        : 'STU-001'
    const student = students[resolvedStudentId] || students['STU-001']
    return {
      studentId: resolvedStudentId,
      ...student,
      monthlyAllowance: 10,
      disbursements:
        resolvedStudentId === 'STU-001'
          ? [
              {
                scheduleId: 'SCH-NOV-001',
                studentId: resolvedStudentId,
                period: 'November 2026',
                amount: 10,
                status: 'VERIFIED',
                txHash: mockTxHash,
                xrplExplorerUrl: `https://testnet.xrpl.org/transactions/${mockTxHash}`,
                updatedAt: '2026-11-12T16:45:00.000Z',
              },
            ]
          : [],
    }
  },
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

function normalizeIdentifiedRecord(record, fallbackKey) {
  const identifier = record._id ?? record.id ?? record[fallbackKey]
  return identifier === undefined ? { ...record } : { ...record, _id: identifier }
}

function normalizeDateFields(record) {
  return {
    ...record,
    month: record.month ?? record.period,
    timestamp: record.timestamp ?? record.updatedAt,
  }
}

function normalizeXrpAmounts(record, fields) {
  const currency = record.currency || 'XRP'
  const normalized = { ...record, currency }

  if (currency !== 'XRP') return normalized

  fields.forEach((field) => {
    const rawAmount = record[field]
    if (rawAmount === undefined || rawAmount === null || rawAmount === '') return

    const amountXRP = Number(rawAmount)
    if (!Number.isFinite(amountXRP)) return

    normalized[`${field}XRP`] = amountXRP
    normalized[`${field}ZARIndicative`] = amountXRP * XRP_TO_ZAR_DEMO_RATE
  })

  return normalized
}

function normalizeProgramme(programme) {
  const identified = normalizeIdentifiedRecord(programme, 'programmeId')
  return normalizeXrpAmounts(
    {
      ...identified,
      programmeId: programme.programmeId ?? programme.id ?? identified._id,
    },
    ['totalBudget', 'remainingBudget'],
  )
}

function normalizeBeneficiary(beneficiary) {
  return normalizeXrpAmounts(
    normalizeIdentifiedRecord(beneficiary, 'studentId'),
    ['monthlyAllowance'],
  )
}

function normalizeSchedule(schedule) {
  return normalizeXrpAmounts(
    normalizeDateFields(normalizeIdentifiedRecord(schedule, 'scheduleId')),
    ['amount'],
  )
}

function normalizeAuditLog(log) {
  const normalized = normalizeXrpAmounts(
    normalizeDateFields(normalizeIdentifiedRecord(log, 'id')),
    ['amount'],
  )
  return {
    ...normalized,
    reasonCode: normalized.reasonCode ?? normalized.rejectionReason ?? null,
  }
}

function normalizeArrayResponse(data, normalize, label) {
  if (!Array.isArray(data)) {
    throw new TypeError(`Expected ${label} response to be an array.`)
  }
  return data.map(normalize)
}

function normalizeObjectResponse(data, normalize, label) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new TypeError(`Expected ${label} response to be an object.`)
  }
  return normalize(data)
}

function normalizeStudentStatus(data) {
  const student = normalizeBeneficiary(data)
  const disbursements = normalizeArrayResponse(
    data.disbursements ?? [],
    normalizeSchedule,
    'student disbursements',
  )
  return { ...student, disbursements }
}

function normalizeAgentResult(item) {
  const decision =
    item.decision && typeof item.decision === 'object' ? item.decision : {}
  const normalized = normalizeXrpAmounts(
    normalizeDateFields(normalizeIdentifiedRecord(item, 'scheduleId')),
    ['amount'],
  )
  const status =
    decision.approved === true && decision.executed === false
      ? 'LEDGER_FAILED'
      : item.status ||
        (decision.approved === true
          ? 'APPROVED_AND_EXECUTED'
          : decision.approved === false
            ? 'REJECTED_BY_POLICY'
            : 'UNKNOWN')

  return {
    ...normalized,
    status,
    reasonCode: item.reasonCode ?? decision.reasonCode ?? null,
    reason:
      item.reason ??
      item.reasonCode ??
      decision.reasonCode ??
      decision.error ??
      decision.message ??
      null,
    decisionId: item.decisionId ?? decision.decisionId ?? null,
    policyVersion: item.policyVersion ?? decision.policyVersion ?? null,
    txHash: item.txHash ?? decision.txHash ?? null,
    explorerUrl: item.explorerUrl ?? decision.explorerUrl ?? null,
    ledgerResult: item.ledgerResult ?? decision.ledgerResult ?? null,
  }
}

function normalizeAgentReport(report) {
  const sourceResults = Array.isArray(report.results)
    ? report.results
    : Array.isArray(report.processed)
      ? report.processed
      : []
  const processed = sourceResults.map(normalizeAgentResult)

  return {
    ...report,
    processedCount: report.processedCount ?? processed.length,
    processed,
    results: processed,
  }
}

function normalizeAgentStatus(data) {
  const status = String(data.status || 'IDLE').toUpperCase()
  return { ...data, status: status === 'STANDBY' ? 'IDLE' : status }
}

function normalizePolicyDecision(result) {
  const decision =
    result.decision && typeof result.decision === 'object'
      ? result.decision
      : {}
  const normalized = { ...result }

  ;['reasonCode', 'decisionId', 'policyVersion'].forEach((field) => {
    const value = result[field] ?? decision[field]
    if (value !== undefined) normalized[field] = value
  })

  return normalized
}

async function request(
  path,
  { method = 'GET', body, fallback, acceptedStatuses = [] } = {},
) {
  const url = `${API_BASE_URL}${path}`
  const endpoint = `${method} ${path}`
  let response

  try {
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-user-role': getActiveUserRole()
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

  if (!response.ok && !acceptedStatuses.includes(response.status)) {
    if (response.status !== 403) updateApiMode(endpoint, 'OFFLINE')
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
  return request('/programmes', { fallback: mockData.programmes }).then((data) =>
    normalizeArrayResponse(data, normalizeProgramme, 'programmes'),
  )
}

export function createProgramme(data) {
  return request('/programmes', { method: 'POST', body: data }).then((result) =>
    normalizeObjectResponse(result, normalizeProgramme, 'programme'),
  )
}

export function updateProgramme(id, data) {
  return request(`/programmes/${id}`, { method: 'PATCH', body: data }).then((result) =>
    normalizeObjectResponse(result, normalizeProgramme, 'programme'),
  )
}

export function toggleProgrammePause(id, programmeId, isPaused) {
  const targetId = id || programmeId || 'PRG-WTC-2026'
  return request(`/programmes/${targetId}/toggle-pause`, {
    method: 'PATCH',
    fallback: () => ({ message: 'Toggled pause', programmeId: targetId, isPaused: !isPaused })
  }).then((result) =>
    normalizeObjectResponse(
      result,
      (programme) => normalizeIdentifiedRecord(programme, 'programmeId'),
      'programme pause',
    ),
  )
}

export function getBeneficiaries() {
  return request('/beneficiaries', { fallback: mockData.beneficiaries }).then((data) =>
    normalizeArrayResponse(data, normalizeBeneficiary, 'beneficiaries'),
  )
}

export function createBeneficiary(data) {
  return request('/beneficiaries', { method: 'POST', body: data }).then((result) =>
    normalizeObjectResponse(result, normalizeBeneficiary, 'beneficiary'),
  )
}

export function updateBeneficiary(studentId, data) {
  return request(`/beneficiaries/${studentId}`, { method: 'PATCH', body: data }).then(
    (result) =>
      normalizeObjectResponse(result, normalizeBeneficiary, 'beneficiary'),
  )
}

export function getSchedules() {
  return request('/schedules', { fallback: mockData.schedules }).then((data) =>
    normalizeArrayResponse(data, normalizeSchedule, 'schedules'),
  )
}

export function getAuditLogs() {
  return request('/audit-logs', { fallback: mockData.auditLogs }).then((data) =>
    normalizeArrayResponse(data, normalizeAuditLog, 'audit logs'),
  )
}

export function getAuditSummary() {
  return request('/audit-summary', { fallback: mockData.auditSummary }).then(
    (result) =>
      normalizeObjectResponse(
        result,
        (summary) => ({
          ...summary,
          latestLog: summary.latestLog
            ? normalizeAuditLog(summary.latestLog)
            : null,
        }),
        'audit summary',
      ),
  )
}

export function getAnalytics() {
  return request('/analytics', { fallback: mockData.analytics })
}

export async function downloadAuditorExport(format = 'csv') {
  const path = `/auditor/export?format=${encodeURIComponent(format)}`
  const endpoint = `GET ${path}`
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        Accept: 'text/csv, application/json',
        'x-user-role': getActiveUserRole(),
      },
    })
  } catch (error) {
    updateApiMode(endpoint, 'OFFLINE')
    throw error
  }

  if (!response.ok) {
    if (response.status !== 403) updateApiMode(endpoint, 'OFFLINE')
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.error || errorData.message || `Request failed with status ${response.status}`,
    )
  }

  const blob = await response.blob()
  updateApiMode(endpoint, 'LIVE')
  const fileUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = fileUrl
  link.download = `FundFlow_Forensic_Audit_Report.${format}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 0)
}

export function triggerAgent() {
  return request('/agent/trigger', {
    method: 'POST',
    fallback: () => ({
      success: true,
      cycleId: 'MOCK-CYCLE-001',
      processedCount: 1,
      timestamp: new Date().toISOString(),
      results: [
        {
          scheduleId: 'SCH-NOV-001',
          studentId: 'STU-001',
          amount: 10,
          status: 'APPROVED_AND_EXECUTED',
          decision: {
            approved: true,
            executed: true,
            decisionId: 'MOCK-DECISION-001',
            policyVersion: 'demo-v1',
            txHash: mockTxHash,
            explorerUrl: `https://testnet.xrpl.org/transactions/${mockTxHash}`,
          },
        },
      ],
    }),
  }).then((result) =>
    normalizeObjectResponse(result, normalizeAgentReport, 'agent trigger'),
  )
}

export function triggerAgentCycle() {
  return triggerAgent()
}

export function getAgentStatus() {
  return request('/agent/status', { fallback: () => ({ status: 'STANDBY' }) }).then(
    (result) =>
      normalizeObjectResponse(result, normalizeAgentStatus, 'agent status'),
  )
}

export function getXrplAccountInfo(address) {
  return request(`/xrpl/account-info/${address}`, { fallback: () => ({ balanceXRP: 100 }) })
}

export function getXrplAdminWallet() {
  return request('/xrpl/admin-wallet', { fallback: () => ({ address: 'rLoL5k1M4RTAkvayLG6sWyCD49GdkeaQTJ', balanceXRP: 100, sequence: 1 }) })
}

export function getStudentStatus(studentId) {
  return request(`/students/${studentId}/status`, {
    fallback: () => mockData.studentStatus(studentId),
  }).then((result) =>
    normalizeObjectResponse(result, normalizeStudentStatus, 'student status'),
  )
}

export function claimStudentAllowance(studentId) {
  return request(`/students/${studentId}/claim`, { method: 'POST' })
}

export function validateAndPay(payload) {
  return request('/disbursements/validate-and-pay', {
    method: 'POST',
    body: payload,
    acceptedStatuses: [422],
  }).then((result) =>
    normalizeObjectResponse(result, normalizePolicyDecision, 'policy decision'),
  )
}

export function resetDemo() {
  return request('/demo/reset', { method: 'POST' })
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
  downloadAuditorExport,
  triggerAgentCycle,
  triggerAgent,
  getAgentStatus,
  getXrplAccountInfo,
  getXrplAdminWallet,
  getStudentStatus,
  claimStudentAllowance,
  validateAndPay,
  resetDemo
}

export default api
