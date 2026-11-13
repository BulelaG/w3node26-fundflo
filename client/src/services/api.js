export const API_BASE_URL = 'http://localhost:5000/api'

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

const mockTxHash =
  'E3F92C80A5D6A1B2C3D4E5F60718293A4B5C6D7E8F90123456789ABCDEF0B37A'

const mockData = {
  health: () => ({
    status: 'MOCK',
    service: 'FundFlow Backend Engine',
    environment: 'development',
    timestamp: new Date().toISOString(),
  }),
  programmes: () => [
    {
      _id: 'mock-programme-001',
      programmeId: 'PRG-WE-THINK-CODE-2026',
      name: 'WeThinkCode Student Living Allowance Fund',
      sponsor: 'National Tech Bursary Alliance',
      totalBudget: 50000,
      remainingBudget: 46700,
      currency: 'XRP',
      isPaused: false,
      beneficiaryCount: 5,
      createdAt: '2026-11-12T10:00:00.000Z',
    },
  ],
  beneficiaries: () => [
    {
      _id: 'mock-beneficiary-001',
      studentId: 'STU-2026-001',
      fullName: 'Sipho Dlamini',
      institution: 'WeThinkCode Cape Town',
      walletAddress: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      monthlyAllowance: 1650,
      status: 'ACTIVE',
      programmeId: 'PRG-WE-THINK-CODE-2026',
    },
    {
      _id: 'mock-beneficiary-002',
      studentId: 'STU-2026-002',
      fullName: 'Lerato Mokoena',
      institution: 'WeThinkCode Johannesburg',
      walletAddress: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
      monthlyAllowance: 1650,
      status: 'ACTIVE',
      programmeId: 'PRG-WE-THINK-CODE-2026',
    },
    {
      _id: 'mock-beneficiary-003',
      studentId: 'STU-2026-003',
      fullName: 'Thabo Nkosi',
      institution: 'WeThinkCode Cape Town',
      walletAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6paa',
      monthlyAllowance: 1650,
      status: 'ACTIVE',
      programmeId: 'PRG-WE-THINK-CODE-2026',
    },
    {
      _id: 'mock-beneficiary-004',
      studentId: 'STU-2026-004',
      fullName: 'Amahle Ndlovu',
      institution: 'WeThinkCode Johannesburg',
      walletAddress: 'rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh',
      monthlyAllowance: 1650,
      status: 'ACTIVE',
      programmeId: 'PRG-WE-THINK-CODE-2026',
    },
    {
      _id: 'mock-beneficiary-005',
      studentId: 'STU-2026-005',
      fullName: 'Naledi Khumalo',
      institution: 'WeThinkCode Cape Town',
      walletAddress: 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWxqf',
      monthlyAllowance: 1650,
      status: 'ACTIVE',
      programmeId: 'PRG-WE-THINK-CODE-2026',
    },
  ],
  schedules: () => [
    {
      scheduleId: 'SCH-001',
      studentId: 'STU-2026-001',
      month: 'November 2026',
      amount: 1650,
      status: 'PENDING',
    },
    {
      scheduleId: 'SCH-002',
      studentId: 'STU-2026-002',
      month: 'November 2026',
      amount: 1650,
      status: 'PENDING',
    },
    {
      scheduleId: 'SCH-003',
      studentId: 'STU-2026-003',
      month: 'November 2026',
      amount: 5000,
      status: 'PENDING',
    },
  ],
  studentStatus: (studentId) => {
    const student = mockData.beneficiaries().find(
      (beneficiary) => beneficiary.studentId === studentId,
    )

    if (!student) return null

    const disbursements =
      studentId === 'STU-2026-001'
        ? [
            {
              scheduleId: 'SCH-001',
              month: 'November 2026',
              amount: 1650,
              status: 'VERIFIED',
              txHash: mockTxHash,
              xrplExplorerUrl: `https://testnet.xrpl.org/transactions/${mockTxHash}`,
              timestamp: '2026-11-12T16:45:00.000Z',
            },
          ]
        : mockData
            .schedules()
            .filter((schedule) => schedule.studentId === studentId)
            .map((schedule) => ({
              scheduleId: schedule.scheduleId,
              month: schedule.month,
              amount: schedule.amount,
              status: schedule.status,
            }))

    return {
      studentId: student.studentId,
      fullName: student.fullName,
      institution: student.institution,
      monthlyAllowance: student.monthlyAllowance,
      walletAddress: student.walletAddress,
      disbursements,
    }
  },
  agentTrigger: () => ({
    success: true,
    cycleId: 'CYC-1731427200',
    scannedCount: 3,
    processed: [
      {
        scheduleId: 'SCH-001',
        studentId: 'STU-2026-001',
        amount: 1650,
        status: 'APPROVED_AND_EXECUTED',
        txHash: mockTxHash,
      },
      {
        scheduleId: 'SCH-002',
        studentId: 'STU-2026-002',
        amount: 1650,
        status: 'APPROVED_AND_EXECUTED',
        txHash:
          'A4B5C6D7E8F90123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123',
      },
      {
        scheduleId: 'SCH-003',
        studentId: 'STU-2026-003',
        amount: 5000,
        status: 'REJECTED_BY_POLICY',
        reason: 'ERR_EXCEEDS_STUDENT_ALLOWANCE_CAP',
      },
    ],
  }),
  auditLogs: () => [
    {
      _id: 'mock-audit-001',
      timestamp: '2026-11-12T16:45:00.000Z',
      eventType: 'DISBURSEMENT_ATTEMPT',
      studentId: 'STU-2026-001',
      programmeId: 'PRG-WE-THINK-CODE-2026',
      amount: 1650,
      policyDecision: 'APPROVED',
      rejectionReason: null,
      txHash: mockTxHash,
      ledgerResult: 'tesSUCCESS',
    },
    {
      _id: 'mock-audit-002',
      timestamp: '2026-11-12T16:46:00.000Z',
      eventType: 'DISBURSEMENT_ATTEMPT',
      studentId: 'STU-2026-003',
      programmeId: 'PRG-WE-THINK-CODE-2026',
      amount: 5000,
      policyDecision: 'REJECTED',
      rejectionReason: 'ERR_EXCEEDS_STUDENT_ALLOWANCE_CAP',
      txHash: null,
      ledgerResult: null,
    },
  ],
}

async function request(path, { method = 'GET', fallback } = {}) {
  const url = `${API_BASE_URL}${path}`
  const endpoint = `${method} ${path}`
  let response

  try {
    response = await fetch(url, {
      method,
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    updateApiMode(endpoint, 'OFFLINE')
    throw error
  }

  if (response.status === 404) {
    updateApiMode(endpoint, 'MOCK')
    console.warn(
      `[FundFlow API] ${method} ${path} returned 404; using mock data.`,
    )
    return fallback()
  }

  if (!response.ok) {
    updateApiMode(endpoint, 'OFFLINE')
    throw new Error(
      `[FundFlow API] ${method} ${path} failed with status ${response.status}.`,
    )
  }

  try {
    const data = await response.json()
    updateApiMode(endpoint, 'LIVE')
    return data
  } catch (error) {
    updateApiMode(endpoint, 'OFFLINE')
    throw error
  }
}

export function getHealth() {
  return request('/health', { fallback: mockData.health })
}

export function getProgrammes() {
  return request('/programmes', { fallback: mockData.programmes })
}

export function getBeneficiaries() {
  return request('/beneficiaries', { fallback: mockData.beneficiaries })
}

export function getSchedules() {
  return request('/schedules', { fallback: mockData.schedules })
}

export function getStudentStatus(studentId) {
  return request(`/students/${encodeURIComponent(studentId)}/status`, {
    fallback: () => mockData.studentStatus(studentId),
  })
}

export function toggleProgrammePause(id, programmeId, isPaused) {
  return request(
    `/programmes/${encodeURIComponent(id)}/toggle-pause`,
    {
      method: 'PATCH',
      fallback: () => ({
        message: 'Programme pause status updated in demo mode',
        programmeId,
        isPaused: !isPaused,
      }),
    },
  )
}

export function triggerAgent() {
  return request('/agent/trigger', {
    method: 'POST',
    fallback: mockData.agentTrigger,
  })
}

export function getAuditLogs() {
  return request('/audit-logs', { fallback: mockData.auditLogs })
}
