import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Zap,
  Users,
  Wallet,
  AlertOctagon,
  Play,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Copy,
  Lock,
  PlusCircle,
  Sliders,
  Search,
  Filter,
  Check,
  Edit2
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function AdminDashboard({
  programme,
  programmes = [],
  onSelectProgramme,
  beneficiaries = [],
  schedules = [],
  auditLogs = [],
  auditSummary = {},
  onActionSuccess
}) {
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [isTogglingPause, setIsTogglingPause] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);
  const [simulatingAttack, setSimulatingAttack] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showNewMandateModal, setShowNewMandateModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Forms
  const [studentForm, setStudentForm] = useState({ fullName: '', institution: 'WeThinkCode Cape Town', monthlyAllowance: 10 });
  const [mandateForm, setMandateForm] = useState({ name: '', sponsor: '', totalBudget: 50000 });
  const [editAllowanceValue, setEditAllowanceValue] = useState(10);

  // Search & Filter
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Admin Wallet Balance on XRPL
  const [adminLedgerInfo, setAdminLedgerInfo] = useState(null);

  useEffect(() => {
    async function loadAdminLedger() {
      try {
        const info = await api.getXrplAdminWallet();
        setAdminLedgerInfo(info);
      } catch (e) {
        console.error('Failed to query admin ledger balance:', e);
      }
    }
    loadAdminLedger();
  }, []);

  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 6000);
  };

  // Trigger Autonomous Agent Cycle
  const handleTriggerAgent = async () => {
    setIsAgentRunning(true);
    try {
      const result = await api.triggerAgentCycle();
      showNotification(
        'success',
        'Autonomous Cycle Finished',
        `Dispatched ${result.processedCount} scheduled payment(s) to the XRP Ledger.`
      );
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      showNotification('error', 'Agent Cycle Failed', err.message);
    } finally {
      setIsAgentRunning(false);
    }
  };

  // Toggle Emergency Kill Switch
  const handleTogglePause = async () => {
    if (!programme) return;
    setIsTogglingPause(true);
    try {
      const res = await api.togglePauseProgramme(programme.id);
      showNotification(
        res.isPaused ? 'warning' : 'success',
        res.isPaused ? 'CFO Kill Switch Engaged' : 'Mandate Resumed',
        `Autonomous payouts are now ${res.isPaused ? 'FROZEN' : 'ACTIVE'}.`
      );
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      showNotification('error', 'Failed to toggle pause', err.message);
    } finally {
      setIsTogglingPause(false);
    }
  };

  // Onboard Student Beneficiary
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.createBeneficiary({
        ...studentForm,
        programmeId: programme ? programme.id : 'PRG-WTC-2026'
      });
      showNotification('success', 'Beneficiary Whitelisted', `${studentForm.fullName} added to funding mandate.`);
      setShowAddStudentModal(false);
      setStudentForm({ fullName: '', institution: 'WeThinkCode Cape Town', monthlyAllowance: 10 });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      showNotification('error', 'Onboarding Failed', err.message);
    }
  };

  // Update Allowance Cap
  const handleUpdateAllowance = async (studentId) => {
    try {
      await api.updateBeneficiary(studentId, { monthlyAllowance: editAllowanceValue });
      showNotification('success', 'Policy Limit Updated', `Allowance cap adjusted to ${editAllowanceValue} XRP.`);
      setEditingStudent(null);
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      showNotification('error', 'Update Failed', err.message);
    }
  };

  // Create New Mandate
  const handleCreateMandate = async (e) => {
    e.preventDefault();
    try {
      const newP = await api.createProgramme(mandateForm);
      showNotification('success', 'Mandate Created', `${newP.name} initialized with ${newP.totalBudget} XRP.`);
      setShowNewMandateModal(false);
      setMandateForm({ name: '', sponsor: '', totalBudget: 50000 });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      showNotification('error', 'Failed to create mandate', err.message);
    }
  };

  // Simulate Attack for Judges
  const handleSimulateAttack = async (type) => {
    setSimulatingAttack(true);
    try {
      let payload;
      if (type === 'duplicate') {
        payload = {
          programmeId: programme.id,
          studentId: 'STU-001',
          amount: 10,
          scheduleId: 'SCH-NOV-001'
        };
      } else if (type === 'overbudget') {
        payload = {
          programmeId: programme.id,
          studentId: 'STU-001',
          amount: 50,
          scheduleId: 'SCH-NOV-002'
        };
      } else {
        payload = {
          programmeId: programme.id,
          studentId: 'STU-GHOST-999',
          amount: 10,
          scheduleId: 'SCH-NOV-003'
        };
      }

      await api.validateAndPay(payload);
    } catch (err) {
      showNotification('blocked', 'Policy Engine Intercepted Attack!', err.message);
    } finally {
      setSimulatingAttack(false);
      if (onActionSuccess) onActionSuccess();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const totalBudget = programme ? programme.totalBudget : 50000;
  const remainingBudget = programme ? programme.remainingBudget : 50000;
  const budgetPercentage = ((remainingBudget / totalBudget) * 100).toFixed(1);
  const isPaused = programme ? programme.isPaused : false;

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditFilter === 'APPROVED' && log.policyDecision !== 'APPROVED') return false;
    if (auditFilter === 'BLOCKED' && log.policyDecision !== 'REJECTED') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = log.studentId && log.studentId.toLowerCase().includes(q);
      const matchHash = log.txHash && log.txHash.toLowerCase().includes(q);
      const matchReason = log.rejectionReason && log.rejectionReason.toLowerCase().includes(q);
      return matchId || matchHash || matchReason;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '12px',
          backgroundColor: notification.type === 'blocked' ? 'rgba(239, 68, 68, 0.95)' :
                           notification.type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
          animation: 'slideDown 0.3s ease'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{notification.title}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.95 }}>{notification.message}</div>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Programme Mandate Selector & Quick Settings */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
              Active Funding Mandate
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
              <select
                value={programme ? programme.id : ''}
                onChange={(e) => onSelectProgramme && onSelectProgramme(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.92rem',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
              <StatusBadge status={isPaused ? 'PAUSED' : 'ACTIVE'} label={isPaused ? 'PAUSED' : 'LIVE'} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="btn btn-outline"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <PlusCircle size={15} color="var(--accent-cyan)" />
            <span>Whitelist Student</span>
          </button>

          <button
            onClick={() => setShowNewMandateModal(true)}
            className="btn btn-outline"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <Sliders size={15} color="var(--accent-cyan)" />
            <span>New Mandate</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '18px' }}>
        <StatCard
          title="Mandate Treasury"
          value={`${totalBudget.toLocaleString()} XRP`}
          subtext="~R1,250,000 Allocation"
          icon={Wallet}
          accentColor="#00f2fe"
        />

        <StatCard
          title="Remaining Balance"
          value={`${remainingBudget.toLocaleString()} XRP`}
          subtext={`${budgetPercentage}% Available on Ledger`}
          icon={Zap}
          progress={parseFloat(budgetPercentage)}
          accentColor="#10b981"
        />

        <StatCard
          title="Whitelisted Students"
          value={`${beneficiaries.length} Bursars`}
          subtext="South African Students"
          icon={Users}
          accentColor="#38bdf8"
        />

        <StatCard
          title="Live Sponsor Balance"
          value={adminLedgerInfo ? `${adminLedgerInfo.balanceXRP.toFixed(2)} XRP` : 'Syncing...'}
          subtext={adminLedgerInfo ? `Address: ${adminLedgerInfo.address.substring(0, 8)}...` : 'Connected to Testnet'}
          icon={ShieldCheck}
          accentColor="#a855f7"
        />
      </div>

      {/* Primary Control Deck: AI Agent & CFO Kill Switch */}
      <div className="card" style={{
        background: isPaused
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(11, 11, 16, 0.98) 100%)'
          : 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(11, 11, 16, 0.98) 100%)',
        borderColor: isPaused ? 'rgba(239, 68, 68, 0.5)' : 'rgba(0, 242, 254, 0.3)',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="font-display" style={{ fontSize: '1.3rem', fontWeight: '700', color: '#ffffff' }}>
                Autonomous AI Disbursement Engine
              </span>
              <StatusBadge
                status={isPaused ? 'PAUSED' : isAgentRunning ? 'PROCESSING' : 'ACTIVE'}
                label={isPaused ? 'KILL SWITCH ENGAGED' : isAgentRunning ? 'AGENT RUNNING...' : 'DAEMON STANDBY'}
              />
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-dim)', maxWidth: '680px' }}>
              The AI agent monitors scheduled stipends and proposes execution on the XRP Ledger.
              <strong> An independent, zero-trust policy engine</strong> enforces all caps, idempotency locks, and budget constraints outside the agent's reach.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleTriggerAgent}
              disabled={isAgentRunning || isPaused}
              className="btn btn-primary"
              style={{ minWidth: '210px' }}
            >
              <Play size={16} fill="#000000" />
              {isAgentRunning ? 'Settling on Ledger...' : 'Run Autonomous Cycle'}
            </button>

            <button
              onClick={handleTogglePause}
              disabled={isTogglingPause}
              className={`btn ${isPaused ? 'btn-primary' : 'btn-danger'}`}
              style={{ minWidth: '170px' }}
            >
              {isPaused ? <ShieldCheck size={16} /> : <AlertOctagon size={16} />}
              {isPaused ? 'Resume Mandate' : 'Emergency Pause'}
            </button>
          </div>
        </div>

        {/* Demo Attack Sandbox */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <Lock size={14} color="var(--accent-cyan)" />
            <span><strong>Out-of-Agent Security Testbed:</strong> Trigger intentional policy violations to see the independent engine intercept:</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleSimulateAttack('duplicate')}
              disabled={simulatingAttack}
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              Test Replay / Duplicate
            </button>

            <button
              onClick={() => handleSimulateAttack('overbudget')}
              disabled={simulatingAttack}
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              Test Allowance Exceedance
            </button>

            <button
              onClick={() => handleSimulateAttack('ghost')}
              disabled={simulatingAttack}
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              Test Ghost Beneficiary
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
        {/* Left Column: Beneficiaries & Schedules */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff' }}>
                Whitelisted Students & Dynamic Caps
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Bursary recipients under mandate {programme ? programme.id : ''}
              </p>
            </div>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="btn btn-outline"
              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
            >
              <PlusCircle size={13} /> Add
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Monthly Cap</th>
                  <th>XRPL Address</th>
                  <th>Schedule Status</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaries.map((b) => {
                  const studentSchedule = schedules.find(s => s.studentId === b.studentId);
                  const isEditing = editingStudent === b.studentId;

                  return (
                    <tr key={b.studentId}>
                      <td>
                        <div style={{ fontWeight: '600', color: '#ffffff' }}>{b.fullName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{b.studentId} • {b.institution}</div>
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              value={editAllowanceValue}
                              onChange={(e) => setEditAllowanceValue(e.target.value)}
                              style={{ width: '60px', padding: '2px 6px', background: '#000', color: '#fff', border: '1px solid var(--accent-cyan)', borderRadius: '4px' }}
                            />
                            <button
                              onClick={() => handleUpdateAllowance(b.studentId)}
                              style={{ background: 'var(--accent-green)', border: 'none', borderRadius: '4px', padding: '2px 6px', color: '#000' }}
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{b.monthlyAllowance} XRP</span>
                            <button
                              onClick={() => { setEditingStudent(b.studentId); setEditAllowanceValue(b.monthlyAllowance); }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                              title="Adjust allowance limit outside agent"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        )}
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>~R{(b.monthlyAllowance * 165).toFixed(0)} ZAR</div>
                      </td>
                      <td>
                        {b.walletAddress ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                              {b.walletAddress.substring(0, 6)}...{b.walletAddress.substring(b.walletAddress.length - 4)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(b.walletAddress)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
                              title="Copy XRPL Address"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Auto-provisions on cycle</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={studentSchedule ? studentSchedule.status : 'PENDING'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Live Policy Engine Audit Trail with Search & Filter */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff' }}>
                Cryptographic Policy Audit Trail
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Immutable event stream of approvals, rejections, and ledger hashes
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-surface-elevated)', padding: '3px', borderRadius: '8px' }}>
              {['ALL', 'APPROVED', 'BLOCKED'].map(f => (
                <button
                  key={f}
                  onClick={() => setAuditFilter(f)}
                  style={{
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: auditFilter === f ? 'var(--accent-cyan)' : 'transparent',
                    color: auditFilter === f ? '#000000' : 'var(--text-dim)'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search by student, tx hash, or rejection code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '34px', fontSize: '0.8rem', height: '36px' }}
            />
          </div>

          <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {filteredAuditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No matching audit logs found.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Target / Amount</th>
                    <th>Decision</th>
                    <th>Reason / Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.map((log) => {
                    const isApproved = log.policyDecision === 'APPROVED';
                    const timeStr = new Date(log.timestamp).toLocaleTimeString();

                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {timeStr}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#ffffff' }}>{log.studentId}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)' }}>{log.amount} XRP</div>
                        </td>
                        <td>
                          <StatusBadge status={isApproved ? 'APPROVED' : 'BLOCKED'} />
                        </td>
                        <td>
                          {log.txHash ? (
                            <a
                              href={log.explorerUrl || `https://testnet.xrpl.org/transactions/${log.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                            >
                              <span className="mono">{log.txHash.substring(0, 8)}...</span>
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: '600' }}>
                              {log.rejectionReason}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Onboard New Beneficiary */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '8px' }}>
              Whitelist New Beneficiary
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '20px' }}>
              Add a synthetic student to mandate {programme ? programme.id : ''}. An autonomous allowance schedule will be assigned.
            </p>

            <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kagiso Motsepe"
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  className="form-input"
                  style={{ marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Institution</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WeThinkCode Johannesburg"
                  value={studentForm.institution}
                  onChange={(e) => setStudentForm({ ...studentForm, institution: e.target.value })}
                  className="form-input"
                  style={{ marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Monthly Allowance Cap (XRP)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={studentForm.monthlyAllowance}
                  onChange={(e) => setStudentForm({ ...studentForm, monthlyAllowance: e.target.value })}
                  className="form-input"
                  style={{ marginTop: '4px' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  10 XRP represents ~R1,650 South African living stipend.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Whitelist Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create New Funding Mandate */}
      {showNewMandateModal && (
        <div className="modal-overlay" onClick={() => setShowNewMandateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '8px' }}>
              Create New Funding Mandate
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '20px' }}>
              Configure a dedicated bursary fund with independent budgetary boundaries.
            </p>

            <form onSubmit={handleCreateMandate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Programme Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NSFAS TVET Living Allowance Fund"
                  value={mandateForm.name}
                  onChange={(e) => setMandateForm({ ...mandateForm, name: e.target.value })}
                  className="form-input"
                  style={{ marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Sponsoring Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Dept of Higher Education & Training"
                  value={mandateForm.sponsor}
                  onChange={(e) => setMandateForm({ ...mandateForm, sponsor: e.target.value })}
                  className="form-input"
                  style={{ marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Total Treasury Budget (XRP)</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={mandateForm.totalBudget}
                  onChange={(e) => setMandateForm({ ...mandateForm, totalBudget: e.target.value })}
                  className="form-input"
                  style={{ marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewMandateModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Create Mandate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
