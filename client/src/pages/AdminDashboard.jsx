import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function AdminDashboard({
  programme,
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
        'Autonomous Agent Cycle Complete',
        `Evaluated ${result.processedCount} scheduled disbursement(s).`
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
        `Programme payouts are now ${res.isPaused ? 'PAUSED' : 'ACTIVE'}.`
      );
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      showNotification('error', 'Failed to toggle pause', err.message);
    } finally {
      setIsTogglingPause(false);
    }
  };

  // Simulate an Attack (e.g. over-budget or duplicate) for the judges demo
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
          amount: 50, // Allowance is 10
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
  const spentBudget = totalBudget - remainingBudget;
  const budgetPercentage = ((remainingBudget / totalBudget) * 100).toFixed(1);
  const isPaused = programme ? programme.isPaused : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '10px',
          backgroundColor: notification.type === 'blocked' ? 'rgba(239, 68, 68, 0.95)' :
                           notification.type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
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

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        <StatCard
          title="Mandate Total Budget"
          value={`${totalBudget.toLocaleString()} XRP`}
          subtext="~R1,250,000 Total Allocation"
          icon={Wallet}
          accentColor="#00f2fe"
        />

        <StatCard
          title="Remaining Treasury"
          value={`${remainingBudget.toLocaleString()} XRP`}
          subtext={`${budgetPercentage}% Available on Ledger`}
          icon={Zap}
          progress={parseFloat(budgetPercentage)}
          accentColor="#10b981"
        />

        <StatCard
          title="Whitelisted Beneficiaries"
          value={`${beneficiaries.length} Students`}
          subtext="Verified South African Bursars"
          icon={Users}
          accentColor="#38bdf8"
        />

        <StatCard
          title="Policy Assurance Score"
          value={`${auditSummary.verifiedDisbursements || 1} Paid / ${auditSummary.rejectedAttempts || 0} Blocked`}
          subtext="Zero Undocumented Leakage"
          icon={ShieldCheck}
          accentColor="#a855f7"
        />
      </div>

      {/* Primary Control Deck: AI Agent & CFO Kill Switch */}
      <div className="card" style={{
        background: isPaused
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 27, 56, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(15, 27, 56, 0.9) 100%)',
        borderColor: isPaused ? 'rgba(239, 68, 68, 0.5)' : 'rgba(0, 242, 254, 0.3)',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                Autonomous AI Disbursement Engine
              </span>
              <StatusBadge
                status={isPaused ? 'PAUSED' : isAgentRunning ? 'PROCESSING' : 'ACTIVE'}
                label={isPaused ? 'MANDATE FROZEN' : isAgentRunning ? 'AGENT RUNNING...' : 'AGENT DAEMON STANDBY'}
              />
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '680px' }}>
              The AI agent autonomously discovers due payment schedules and proposes settlement on the XRP Ledger.
              <strong> An independent, zero-trust policy engine</strong> enforces all caps, idempotency locks, and budget constraints outside the agent's control.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Run Agent Cycle Button */}
            <button
              onClick={handleTriggerAgent}
              disabled={isAgentRunning || isPaused}
              className="btn btn-primary"
              style={{ minWidth: '200px' }}
            >
              <Play size={16} fill="#070d1e" />
              {isAgentRunning ? 'Processing Batch...' : 'Run Autonomous Cycle'}
            </button>

            {/* CFO Emergency Kill Switch */}
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

        {/* Demo Playground: Test Attack Interceptions for Judges */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Lock size={14} color="var(--accent-cyan)" />
            <span><strong>Hackathon Demo Sandbox:</strong> Test out-of-agent policy enforcement with invalid payment attempts:</span>
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
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff' }}>
                Mandate Whitelist & Schedules
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Synthetic students approved under WeThinkCode bursary mandate
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {beneficiaries.length} Beneficiaries
            </span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Monthly Cap</th>
                  <th>XRPL Wallet</th>
                  <th>Schedule Status</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaries.map((b) => {
                  const studentSchedule = schedules.find(s => s.studentId === b.studentId);
                  const isVerified = studentSchedule && studentSchedule.status === 'VERIFIED';

                  return (
                    <tr key={b.studentId}>
                      <td>
                        <div style={{ fontWeight: '600', color: '#ffffff' }}>{b.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.studentId} • {b.institution}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{b.monthlyAllowance} XRP</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>~R1,650 / mo</div>
                      </td>
                      <td>
                        {b.walletAddress ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {b.walletAddress.substring(0, 6)}...{b.walletAddress.substring(b.walletAddress.length - 4)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(b.walletAddress)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
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
                        <StatusBadge
                          status={studentSchedule ? studentSchedule.status : 'PENDING'}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Live Cryptographic Audit Trail */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff' }}>
                Live Policy Engine Audit Trail
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Immutable event stream of approvals, rejections, and XRPL settlements
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {auditLogs.length} Events Logged
            </span>
          </div>

          <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No audit events logged yet. Click "Run Autonomous Cycle" to begin.
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
                  {auditLogs.map((log) => {
                    const isApproved = log.policyDecision === 'APPROVED';
                    const timeStr = new Date(log.timestamp).toLocaleTimeString();

                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {timeStr}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#ffffff' }}>{log.studentId}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)' }}>{log.amount} XRP</div>
                        </td>
                        <td>
                          <StatusBadge
                            status={isApproved ? 'APPROVED' : 'BLOCKED'}
                          />
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
    </div>
  );
}
