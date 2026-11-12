const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function fetchJSON(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  // Programmes
  getProgrammes: () => fetchJSON('/programmes'),
  createProgramme: (data) => fetchJSON('/programmes', { method: 'POST', body: JSON.stringify(data) }),
  updateProgramme: (id, data) => fetchJSON(`/programmes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  togglePauseProgramme: (id) => fetchJSON(`/programmes/${id}/toggle-pause`, { method: 'PATCH' }),

  // Beneficiaries & Schedules
  getBeneficiaries: () => fetchJSON('/beneficiaries'),
  createBeneficiary: (data) => fetchJSON('/beneficiaries', { method: 'POST', body: JSON.stringify(data) }),
  updateBeneficiary: (studentId, data) => fetchJSON(`/beneficiaries/${studentId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getSchedules: () => fetchJSON('/schedules'),

  // Audit Logs
  getAuditLogs: () => fetchJSON('/audit-logs'),
  getAuditSummary: () => fetchJSON('/audit-summary'),

  // Agent Operations
  triggerAgentCycle: () => fetchJSON('/agent/trigger', { method: 'POST' }),
  getAgentStatus: () => fetchJSON('/agent/status'),

  // Live XRPL Queries
  getXrplAccountInfo: (address) => fetchJSON(`/xrpl/account-info/${address}`),
  getXrplAdminWallet: () => fetchJSON('/xrpl/admin-wallet'),

  // Student Portal
  getStudentStatus: (studentId) => fetchJSON(`/students/${studentId}/status`),

  // Manual payment injection
  validateAndPay: (payload) => fetchJSON('/disbursements/validate-and-pay', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
};
