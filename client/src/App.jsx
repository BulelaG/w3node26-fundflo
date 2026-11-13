import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleAlert,
  Clock3,
  Copy,
  ExternalLink,
  FileCheck2,
  LayoutDashboard,
  LoaderCircle,
  Power,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  Waves,
  Zap,
} from 'lucide-react'
import {
  getAuditLogs,
  getBeneficiaries,
  getHealth,
  getApiMode,
  getProgrammes,
  getSchedules,
  getStudentStatus,
  createBeneficiary,
  createProgramme,
  resetDemo,
  subscribeToApiMode,
  triggerAgent,
  toggleProgrammePause,
  updateBeneficiary,
  validateAndPay,
  XRP_TO_ZAR_DEMO_RATE,
} from './services/api.js'
import AnalyticsDashboard from './pages/AnalyticsDashboard.jsx'
import AuditorPortal from './pages/AuditorPortal.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import './App.css'
import './auth.css'

const REFRESH_INTERVAL = 30000
const ZAR_PER_RLUSD = 18
const DEMO_WALLET_ADDRESS = 'rUfjbcCNpfGduuSGs532cqDqh4wRGauunK'
const DEMO_PROGRAMME_NAME = 'FundFlow Live Policy Demo'
const DEMO_STUDENT_ID = 'STU-DEMO-POLICY'
const DEMO_BUDGET_PROGRAMME_NAME = 'FundFlow Budget Policy Demo'
const DEMO_BUDGET_STUDENT_ID = 'STU-DEMO-BUDGET'
const DEMO_DUPLICATE_STUDENT_ID = 'STU-DEMO-DUPLICATE'
const DEMO_CAP_STUDENT_ID = 'STU-DEMO-CAP'
const DEMO_PAUSED_STUDENT_ID = 'STU-DEMO-PAUSED'

const VIEWS_BY_ROLE = {
  cfo: ['admin', 'analytics', 'auditor'],
  auditor: ['auditor', 'analytics'],
  student: ['student'],
}

const STUDENT_IDS_BY_NAME = {
  'sipho dlamini': 'STU-001',
  'naledi khumalo': 'STU-002',
  'thabo molefe': 'STU-003',
  sipho: 'STU-001',
  naledi: 'STU-002',
  thabo: 'STU-003',
}

function getAllowedViews(role) {
  return VIEWS_BY_ROLE[role] || []
}

function getStudentIdForSession(session) {
  const normalizedName = String(session?.name || '').trim().toLowerCase()
  const firstName = normalizedName.split(/\s+/)[0]
  const knownStudentId =
    STUDENT_IDS_BY_NAME[normalizedName] || STUDENT_IDS_BY_NAME[firstName]
  if (knownStudentId) {
    return session?.studentId && session.studentId !== knownStudentId
      ? ''
      : knownStudentId
  }
  return session?.studentId || ''
}

function fetchDashboardData() {
  return Promise.allSettled([
    getHealth(),
    getProgrammes(),
    getBeneficiaries(),
    getSchedules(),
    getAuditLogs(),
  ])
}

function formatCurrency(value, currency = 'XRP', maximumFractionDigits = 0) {
  const amount = Number(value) || 0
  if (currency === 'RLUSD') {
    return `RLUSD ${new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: maximumFractionDigits ? 2 : 0,
      maximumFractionDigits,
    }).format(amount)}`
  }

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(amount)
}

function formatXrpAmount(value, maximumFractionDigits = 0) {
  const amount = Number(value) || 0
  return `${formatCurrency(amount, 'XRP', maximumFractionDigits)} ≈ ${formatCurrency(
    amount * XRP_TO_ZAR_DEMO_RATE,
    'ZAR',
    2,
  )}`
}

function formatProgrammeVault(programmes) {
  const totalsByCurrency = new Map()
  for (const programme of programmes) {
    const currency = programme.currency || 'XRP'
    totalsByCurrency.set(
      currency,
      (totalsByCurrency.get(currency) || 0) + (Number(programme.totalBudget) || 0),
    )
  }

  return [...totalsByCurrency]
    .map(([currency, total]) =>
      currency === 'XRP'
        ? formatXrpAmount(total)
        : formatCurrency(total, currency),
    )
    .join(' / ')
}

function formatDate(value, options = {}) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-ZA', options)
}

function compactHash(hash) {
  if (!hash) return null
  if (hash.length <= 18) return hash
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`
}

function truncateWallet(address) {
  if (!address || address.length <= 18) return address || ''
  return `${address.slice(0, 9)}...${address.slice(-6)}`
}

function isWalletApproved(student, overrides) {
  const override = overrides[student.studentId]
  if (typeof override === 'boolean') return override
  return (student.status || '').toUpperCase() === 'ACTIVE'
}

function StatusBadge({ status }) {
  const normalized = (status || 'UNKNOWN')
    .toLowerCase()
    .replaceAll('_', '-')
    .replaceAll(' ', '-')
  if (
    ['submitted', 'outcome-pending', 'processing'].includes(normalized)
  ) {
    return (
      <span className="status-badge status-confirming" role="status">
        <span className="confirming-dot" />
        Confirming on XRPL Ledger
      </span>
    )
  }

  const label = (status || 'Unknown').replaceAll('_', ' ')
  const icon =
    normalized.includes('reject') ||
    normalized.includes('paused') ||
    normalized.includes('blocked') ||
    normalized.includes('halt') ? (
      <CircleAlert size={13} />
    ) : normalized.includes('pending') ? (
      <Clock3 size={13} />
    ) : normalized.includes('active') ||
      normalized.includes('verified') ||
      normalized.includes('executed') ||
      normalized.includes('approved') ? (
      <Check size={13} />
    ) : null

  return (
    <span className={`status-badge status-${normalized}`}>
      {icon}
      {label}
    </span>
  )
}

function PageHeader({ title, description, eyebrow, actions }) {
  return (
    <header className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-actions">{actions}</div>
    </header>
  )
}

function MetricCard({ label, value, detail, icon: Icon, tone = 'blue', trend }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className={`metric-icon metric-${tone}`}>
          <Icon size={18} />
        </span>
        {trend && (
          <span className="metric-trend">
            <ArrowUpRight size={14} />
            {trend}
          </span>
        )}
      </div>
      <div
        className={`metric-value ${typeof value === 'string' ? 'financial-value' : ''}`}
      >
        {value}
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-detail">{detail}</div>
    </article>
  )
}

function PipelineBanner({ isBlocked, blockedCount }) {
  return (
    <section
      className={`pipeline-banner ${isBlocked ? 'is-blocked' : ''}`}
      aria-label="Disbursement request pipeline"
      aria-live="polite"
    >
      <div className="pipeline-summary">
        <span className="pipeline-eyebrow">DISBURSEMENT FLOW</span>
        <strong>
          {isBlocked
            ? `${blockedCount} ${blockedCount === 1 ? 'request' : 'requests'} blocked`
            : 'Three-step assurance'}
        </strong>
        <small>
          {isBlocked
            ? 'Independent policy engine prevented ledger submission.'
            : 'Every request is checked before it reaches the ledger.'}
        </small>
      </div>
      <div className="pipeline-steps">
        <div className="pipeline-step">
          <span className="pipeline-step-number">1</span>
          <Zap size={17} />
          <span>Autonomous Agent</span>
        </div>
        <ArrowRight className="pipeline-arrow" size={18} aria-hidden="true" />
        <div className={`pipeline-step policy-step ${isBlocked ? 'blocked' : ''}`}>
          <span className="pipeline-step-number">2</span>
          {isBlocked ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
          <span>Independent Policy Engine</span>
        </div>
        <ArrowRight className="pipeline-arrow" size={18} aria-hidden="true" />
        <div className={`pipeline-step ledger-step ${isBlocked ? 'blocked' : ''}`}>
          <span className="pipeline-step-number">3</span>
          <Waves size={18} />
          <span>XRPL Testnet Ledger</span>
        </div>
      </div>
    </section>
  )
}

function ProgrammeCard({ programme, isPaused }) {
  if (!programme) {
    return (
      <section className="panel programme-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">ACTIVE MANDATE</div>
            <h2>Programme mandate</h2>
          </div>
        </div>
        <div className="empty-state">No funding programmes are available.</div>
      </section>
    )
  }

  const utilization =
    programme.totalBudget > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((programme.totalBudget - programme.remainingBudget) /
              programme.totalBudget) *
              100,
          ),
        )
      : 0

  return (
    <section className="panel programme-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">ACTIVE MANDATE</div>
          <h2>Programme mandate</h2>
        </div>
        <StatusBadge status={isPaused ? 'PAUSED' : 'ACTIVE'} />
      </div>

      <div className="programme-name-row">
        <span className="programme-symbol">
          <Wallet size={21} />
        </span>
        <div>
          <h3>{programme.name}</h3>
          <p>{programme.sponsor}</p>
        </div>
      </div>

      <div className="budget-numbers">
        <div>
          <span>Remaining budget</span>
          <strong className="financial-value">
            {programme.currency === 'XRP'
              ? formatXrpAmount(programme.remainingBudget)
              : formatCurrency(programme.remainingBudget, programme.currency)}
          </strong>
        </div>
        <div className="budget-total">
          <span>Total mandate</span>
          <strong className="financial-value">
            {programme.currency === 'XRP'
              ? formatXrpAmount(programme.totalBudget)
              : formatCurrency(programme.totalBudget, programme.currency)}
          </strong>
        </div>
      </div>
      <div
        className="budget-progress"
        role="progressbar"
        aria-label="Programme budget used"
        aria-valuenow={Math.round(utilization)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${utilization}%` }} />
      </div>
      <div className="budget-foot">
        <span>{Math.round(utilization)}% allocated</span>
        <span>{programme.beneficiaryCount} beneficiaries</span>
      </div>
      <div className="programme-meta">
        <span>
          <span className="meta-dot" />
          {programme.programmeId}
        </span>
        <span>Updated {formatDate(programme.createdAt, { dateStyle: 'medium' })}</span>
      </div>
    </section>
  )
}

function PolicyControls({
  beneficiaries,
  capOverrides,
  onCapChange,
  whitelistOverrides,
  onWhitelistChange,
  currency,
  killSwitchActive,
  onToggleKillSwitch,
  isTogglingKillSwitch,
  killSwitchError,
}) {
  return (
    <section className="panel policy-controls-panel">
      <div className="panel-heading policy-controls-heading">
        <div>
          <div className="eyebrow">MANDATE &amp; POLICY CONTROLS</div>
          <h2>Policy &amp; Mandate Controls</h2>
          <p>Set per-student monthly limits and stop autonomous execution instantly.</p>
        </div>
        <span className="demo-control-tag">
          <SlidersHorizontal size={13} />
          DEMO CONTROLS
        </span>
      </div>

      <div className="policy-controls-grid">
        <div className="cap-control-list">
          <div className="cap-list-heading">
            <span>BENEFICIARY / APPROVED WALLET</span>
            <span>MAX CAP · {currency}</span>
            <span>WHITELIST</span>
          </div>
          {beneficiaries.length ? (
            beneficiaries.map((student) => (
              <div className="cap-control-row" key={student.studentId}>
                <span className="cap-student">
                  <span className="cap-avatar">
                    {student.fullName
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <span>
                    <strong>{student.fullName}</strong>
                    <small>{student.studentId}</small>
                    <small
                      className="cap-wallet-address"
                      title={student.walletAddress || 'No wallet on file'}
                    >
                      {student.walletAddress || 'No wallet on file'}
                    </small>
                  </span>
                </span>
                <label className="cap-input-wrap">
                  <span className="sr-only">
                    Monthly budget cap for {student.fullName}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={
                      capOverrides[student.studentId] ??
                      student.monthlyAllowance
                    }
                    onChange={(event) =>
                      onCapChange(student.studentId, event.target.value)
                    }
                  />
                  <span>{currency}</span>
                </label>
                <div className="whitelist-control">
                  <span
                    className={`whitelist-status ${
                      isWalletApproved(student, whitelistOverrides)
                        ? 'approved'
                        : 'not-approved'
                    }`}
                  >
                    <span />
                    {isWalletApproved(student, whitelistOverrides)
                      ? 'Approved'
                      : 'Not approved'}
                  </span>
                  <button
                    className="whitelist-action-button"
                    type="button"
                    disabled={!student.walletAddress}
                    aria-label={`${
                      isWalletApproved(student, whitelistOverrides)
                        ? 'Revoke'
                        : 'Approve'
                    } ${student.walletAddress || `wallet for ${student.fullName}`}`}
                    onClick={() =>
                      onWhitelistChange(
                        student.studentId,
                        !isWalletApproved(student, whitelistOverrides),
                      )
                    }
                  >
                    {isWalletApproved(student, whitelistOverrides)
                      ? 'Revoke'
                      : 'Approve'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state cap-empty">
              Beneficiary limits will appear here.
            </div>
          )}
          <div className="cap-control-note">
            Cap and whitelist edits apply to this demo session; the API does
            not yet persist individual policy changes.
          </div>
        </div>

        <aside
          className={`kill-switch-panel ${killSwitchActive ? 'engaged' : ''}`}
        >
          <div className="kill-switch-heading">
            <span className="kill-switch-icon">
              <Power size={18} />
            </span>
            <span
              className={`kill-switch-state ${killSwitchActive ? 'halted' : ''}`}
            >
              <span />
              {killSwitchActive ? 'ENGAGED' : 'STANDBY'}
            </span>
          </div>
          <h3>Pause New Authorisations</h3>
          <p>
            {killSwitchActive
              ? 'New payment signing is stopped until the mandate is resumed.'
              : 'Stop new payment authorisations and signing for this mandate.'}
          </p>
          <div className="kill-switch-action">
            <span>{killSwitchActive ? 'Agent execution halted' : 'Agent execution allowed'}</span>
            <button
              className={`switch-control ${killSwitchActive ? 'on' : ''}`}
              type="button"
              role="switch"
              aria-checked={killSwitchActive}
              aria-label="Pause New Authorisations"
              onClick={onToggleKillSwitch}
              disabled={isTogglingKillSwitch}
            >
              <span />
            </button>
          </div>
          {killSwitchError && (
            <div className="kill-switch-error">{killSwitchError}</div>
          )}
          <div className="kill-switch-footnote">
            Stops new signing only. Transactions already settled on XRPL cannot
            be reversed.
          </div>
        </aside>
      </div>
    </section>
  )
}

function AgentCard({
  isRunning,
  triggerResult,
  onTrigger,
  onRunPolicyScenario,
  policyTestResult,
  isKillSwitchActive,
  error,
}) {
  return (
    <section className="agent-card">
      <div className="agent-card-glow" />
      <div className="agent-card-header">
        <span className="agent-icon">
          <Zap size={19} fill="currentColor" />
        </span>
        <span className="agent-label">AUTONOMOUS AGENT</span>
        <span className={`agent-live ${isKillSwitchActive ? 'is-halted' : ''}`}>
          <span />
          {isKillSwitchActive ? 'HALTED' : 'READY'}
        </span>
      </div>
      <h2>Disbursement cycle</h2>
      <p className="agent-description">
        Scan pending schedules, enforce policy, and settle approved payments on
        XRPL Testnet.
      </p>

      {triggerResult ? (
        <div className="cycle-result">
          <div className="cycle-result-heading">
            <BadgeCheck size={17} />
            Cycle {triggerResult.cycleId}
          </div>
          <div className="cycle-result-stats">
            <span>
              <strong>{triggerResult.scannedCount}</strong> scanned
            </span>
            <span>
              <strong>
                {
                  (triggerResult.processed || []).filter((item) =>
                    item.status.includes('APPROVED'),
                  ).length
                }
              </strong>{' '}
              approved
            </span>
            <span>
              <strong>
                {
                  (triggerResult.processed || []).filter((item) =>
                    item.status.includes('REJECTED'),
                  ).length
                }
              </strong>{' '}
              blocked
            </span>
          </div>
        </div>
      ) : (
        <div className="agent-ready-row">
          <span className="agent-ready-dot" />
          <span>Independent policy engine is standing by</span>
        </div>
      )}

      {policyTestResult && (
        <div
          className={`policy-test-result ${policyTestResult.approved ? 'is-approved' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className="policy-test-result-icon">
            <ShieldCheck size={16} />
          </span>
          <span>
            <strong>
              FUNDFLOW POLICY DECISION ·{' '}
              {policyTestResult.approved ? 'APPROVED' : 'REJECTED'}
            </strong>
            <small>{policyTestResult.message}</small>
            <code>
              {policyTestResult.decisionId || 'Decision ID unavailable'} ·{' '}
              {policyTestResult.policyVersion || 'Policy version unavailable'} ·{' '}
              {policyTestResult.reasonCode || 'No rejection reason'}
            </code>
            {policyTestResult.txHash && (
              <a
                className="audit-hash"
                href={`https://testnet.xrpl.org/transactions/${policyTestResult.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {compactHash(policyTestResult.txHash)}
                <ExternalLink size={12} />
              </a>
            )}
          </span>
        </div>
      )}

      {error && <div className="inline-error">{error}</div>}
      {isKillSwitchActive && (
        <div className="kill-switch-banner">
          <CircleAlert size={14} />
          Kill-switch engaged — agent execution is disabled.
        </div>
      )}
      <div className="agent-actions">
        <button
          className="button button-agent"
          onClick={onTrigger}
          disabled={isRunning || isKillSwitchActive}
        >
          {isRunning ? (
            <>
              <LoaderCircle className="spin" size={17} />
              Running…
            </>
          ) : isKillSwitchActive ? (
            <>
              <Power size={15} />
              Agent Halted
            </>
          ) : (
            <>
              <Zap size={16} />
              Agent Trigger
              <ArrowRight size={16} />
            </>
          )}
        </button>
        <button
          className="button button-test-policy"
          onClick={() => onRunPolicyScenario('valid-payment')}
          disabled={isRunning}
        >
          <Check size={15} />
          Valid Run
        </button>
      </div>
      <div className="policy-scenario-heading">
        Live policy-engine tests
      </div>
      <div className="policy-scenario-grid">
        {[
          ['duplicate', 'Duplicate Allowance'],
          ['student-limit', 'Student Limit Exceeded'],
          ['budget', 'Budget Exceeded'],
          ['unapproved-recipient', 'Unapproved Recipient'],
          ['paused-programme', 'Paused Programme'],
        ].map(([scenario, label]) => (
          <button
            className="button button-test-policy"
            key={scenario}
            onClick={() => onRunPolicyScenario(scenario)}
            disabled={isRunning}
          >
            <ShieldCheck size={14} />
            {label}
          </button>
        ))}
      </div>
      <div className="agent-footnote">
        <ShieldCheck size={14} />
        Valid payment submits 10 XRP on XRPL Testnet; other tests exercise live policy checks.
      </div>
    </section>
  )
}

function ScheduleTable({
  schedules,
  beneficiaries,
  currency,
  killSwitchActive,
  whitelistOverrides,
}) {
  const beneficiaryById = useMemo(
    () => new Map(beneficiaries.map((student) => [student.studentId, student])),
    [beneficiaries],
  )
  const pendingCount = schedules.filter(
    (schedule) => (schedule.status || '').toUpperCase() === 'PENDING',
  ).length

  return (
    <section className="panel schedule-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">DISBURSEMENT PIPELINE</div>
          <h2>Scheduled payments</h2>
        </div>
        <span className={`panel-count ${killSwitchActive ? 'is-halted' : ''}`}>
          {killSwitchActive && pendingCount
            ? `${pendingCount} runs halted`
            : `${schedules.length} records`}
        </span>
      </div>
      {schedules.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Beneficiary</th>
                <th>Schedule</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => {
                const student = beneficiaryById.get(schedule.studentId)
                const isPending =
                  (schedule.status || '').toUpperCase() === 'PENDING'
                const isHalted = killSwitchActive && isPending
                const whitelistBlocked =
                  !killSwitchActive &&
                  isPending &&
                  student &&
                  !isWalletApproved(student, whitelistOverrides)
                const displayedStatus = isHalted
                  ? 'HALTED'
                  : whitelistBlocked
                    ? 'BLOCKED'
                    : schedule.status
                return (
                  <tr key={schedule.scheduleId}>
                    <td>
                      <div className="person-cell">
                        <span className="avatar avatar-student">
                          {(student?.fullName || schedule.studentId)
                            .split(' ')
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join('')}
                        </span>
                        <span>
                          <strong>{student?.fullName || schedule.studentId}</strong>
                          <small>{schedule.studentId}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{schedule.month || schedule.scheduleId}</strong>
                      <small className="table-subtext">{schedule.scheduleId}</small>
                    </td>
                    <td className="amount-cell">
                      {currency === 'XRP'
                        ? formatXrpAmount(schedule.amount)
                        : formatCurrency(schedule.amount, currency)}
                    </td>
                    <td>
                      <StatusBadge status={displayedStatus} />
                      {isHalted && (
                        <small className="run-state-note">
                          Emergency kill-switch engaged
                        </small>
                      )}
                      {whitelistBlocked && (
                        <small className="run-state-note is-policy-block">
                          ERR_BENEFICIARY_NOT_WHITELISTED
                        </small>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No scheduled payments to display.</div>
      )}
      <div className="table-footer">
        <span>
          <ShieldCheck size={14} /> All payments are policy-gated
        </span>
        <span>
          {killSwitchActive
            ? 'Disable the kill-switch to resume pending runs'
            : 'Schedule data refreshes with the dashboard'}
        </span>
      </div>
    </section>
  )
}

function AuditPanel({ auditLogs, currency }) {
  return (
    <section className="panel audit-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">XRPL TESTNET</div>
          <h2>Live audit log</h2>
        </div>
        <span className="live-indicator">
          <span />
          LIVE
        </span>
      </div>
      <div className="audit-list">
        {auditLogs.length ? (
          auditLogs.slice(0, 7).map((entry) => {
            const rejected =
              (entry.policyDecision || '').toLowerCase() === 'rejected'
            return (
              <article className="audit-entry" key={entry._id}>
                <span
                  className={`audit-entry-icon ${rejected ? 'is-rejected' : ''}`}
                >
                  {rejected ? (
                    <ArrowDownRight size={16} />
                  ) : (
                    <ArrowUpRight size={16} />
                  )}
                </span>
                <div className="audit-entry-main">
                  <div className="audit-entry-title">
                    <strong>{entry.studentId}</strong>
                    <span className={rejected ? 'text-danger' : 'text-success'}>
                      {entry.policyDecision || 'REVIEW'}
                    </span>
                  </div>
                  <div className="audit-entry-meta">
                    <span>
                      {formatDate(entry.timestamp, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="audit-amount">
                      {currency === 'XRP'
                        ? formatXrpAmount(entry.amount)
                        : formatCurrency(entry.amount, currency)}
                    </span>
                  </div>
                  <div className="audit-policy-decision">
                    <strong>FundFlow Policy Decision</strong>
                    <code>{entry.decisionId || 'Decision ID unavailable'}</code>
                    <small>
                      Policy {entry.policyVersion || 'unversioned'} · Reason{' '}
                      {entry.reasonCode ||
                        entry.rejectionReason ||
                        'NONE'}
                    </small>
                  </div>
                  {entry.txHash ? (
                    <a
                      className="audit-hash"
                      href={`https://testnet.xrpl.org/transactions/${entry.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open XRPL transaction ${entry.txHash} in a new tab`}
                      title={entry.txHash}
                    >
                      {compactHash(entry.txHash)}
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="audit-reason">
                      {entry.rejectionReason || 'No ledger transaction'}
                    </span>
                  )}
                </div>
              </article>
            )
          })
        ) : (
          <div className="empty-state audit-empty">
            Audit activity will appear here.
          </div>
        )}
      </div>
      <div className="audit-footer">
        <span>
          <FileCheck2 size={14} /> Immutable assurance trail
        </span>
        <span>Auto-refreshes every 30 sec</span>
      </div>
    </section>
  )
}

function AdminDashboard({
  programmes,
  beneficiaries,
  schedules,
  auditLogs,
  isLoading,
  isRefreshing,
  isTriggering,
  triggerResult,
  triggerError,
  policyTestResult,
  capOverrides,
  onCapChange,
  whitelistOverrides,
  onWhitelistChange,
  killSwitchActive,
  onToggleKillSwitch,
  isTogglingKillSwitch,
  killSwitchError,
  dashboardError,
  demoResetNotice,
  lastUpdated,
  onRefresh,
  onResetDemo,
  onTrigger,
  onRunPolicyScenario,
  isResettingDemo,
}) {
  const programme = programmes[0]
  const currency = programme?.currency || 'XRP'
  const activeWhitelistedCount = beneficiaries.filter((student) =>
    isWalletApproved(student, whitelistOverrides),
  ).length
  const blockedCount = auditLogs.filter(
    (entry) => (entry.policyDecision || '').toUpperCase() === 'REJECTED',
  ).length
  const vaultCurrencies = [
    ...new Set(programmes.map((item) => item.currency || 'XRP')),
  ].join(' / ')

  return (
    <main className="main-content">
      <PageHeader
        eyebrow="FUNDING ASSURANCE / ADMIN"
        title="Disbursement control"
        description="Monitor mandates, scheduled payments, and ledger assurance in one place."
        actions={
          <>
            <span className="updated-label">
              <Clock3 size={14} />
              Updated {formatDate(lastUpdated, { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              className="button button-secondary"
              onClick={onRefresh}
              disabled={isRefreshing || isResettingDemo}
            >
              <RefreshCw className={isRefreshing ? 'spin' : ''} size={16} />
              Refresh
            </button>
            <button
              className="button button-secondary"
              onClick={onResetDemo}
              disabled={isResettingDemo || isTriggering}
            >
              <RotateCcw className={isResettingDemo ? 'spin' : ''} size={16} />
              {isResettingDemo ? 'Resetting…' : 'Reset Demo'}
            </button>
          </>
        }
      />

      {demoResetNotice && (
        <div className="notice notice-success" role="status">
          <BadgeCheck size={17} />
          <span>{demoResetNotice}</span>
        </div>
      )}

      {dashboardError && (
        <div className="notice notice-error" role="status">
          <CircleAlert size={17} />
          <span>{dashboardError}</span>
        </div>
      )}

      <div className="metrics-grid">
        <MetricCard
          label="Total Programme Vault"
          value={programmes.length ? formatProgrammeVault(programmes) : '—'}
          detail={
            programmes.length
              ? `${programmes.length} programme mandate${programmes.length === 1 ? '' : 's'} · ${vaultCurrencies}`
              : 'No active programme'
          }
          icon={Wallet}
          tone="blue"
        />
        <MetricCard
          label="Active Whitelisted Students"
          value={activeWhitelistedCount}
          detail="Wallets approved for disbursement"
          icon={Users}
          tone="violet"
        />
        <MetricCard
          label="Fraud / Duplicates Blocked"
          value={blockedCount}
          detail="Rejected before ledger submission"
          icon={ShieldAlert}
          tone="red"
        />
        <MetricCard
          label="Avg Settlement Time"
          value="3.4s"
          detail="Across approved settlements"
          icon={Clock3}
          tone="mint"
        />
      </div>

      <PipelineBanner
        isBlocked={blockedCount > 0}
        blockedCount={blockedCount}
      />

      <div className="overview-grid">
        <ProgrammeCard programme={programme} isPaused={killSwitchActive} />
        <AgentCard
          isRunning={isTriggering}
          triggerResult={triggerResult}
          onTrigger={onTrigger}
          onRunPolicyScenario={onRunPolicyScenario}
          policyTestResult={policyTestResult}
          isKillSwitchActive={killSwitchActive}
          error={triggerError}
        />
      </div>

      <PolicyControls
        beneficiaries={beneficiaries}
        capOverrides={capOverrides}
        onCapChange={onCapChange}
        whitelistOverrides={whitelistOverrides}
        onWhitelistChange={onWhitelistChange}
        currency={currency}
        killSwitchActive={killSwitchActive}
        onToggleKillSwitch={onToggleKillSwitch}
        isTogglingKillSwitch={isTogglingKillSwitch}
        killSwitchError={killSwitchError}
      />

      <div className="operations-grid">
        <ScheduleTable
          schedules={schedules}
          beneficiaries={beneficiaries}
          currency={currency}
          killSwitchActive={killSwitchActive}
          whitelistOverrides={whitelistOverrides}
        />
        <AuditPanel auditLogs={auditLogs} currency={currency} />
      </div>

      {isLoading && (
        <div className="loading-indicator">
          <LoaderCircle className="spin" size={16} />
          Loading funding data…
        </div>
      )}
    </main>
  )
}

function StudentPortal({ session }) {
  const studentId = getStudentIdForSession(session)
  const [studentResult, setStudentResult] = useState({
    studentId: '',
    data: null,
    error: '',
  })
  const [walletCopyState, setWalletCopyState] = useState('idle')
  const [walletCopyError, setWalletCopyError] = useState('')

  useEffect(() => {
    if (!studentId) return undefined

    let active = true
    getStudentStatus(studentId)
      .then((response) => {
        if (response.studentId !== studentId) {
          throw new Error('The student record does not match your signed-in account.')
        }
        if (active) {
          setStudentResult({
            studentId,
            data: response,
            error: '',
          })
        }
      })
      .catch((requestError) => {
        if (active) {
          setStudentResult({
            studentId,
            data: null,
            error: requestError.message,
          })
        }
      })

    return () => {
      active = false
    }
  }, [studentId])

  async function handleCopyWallet(address) {
    if (!address) return
    if (!navigator.clipboard?.writeText) {
      setWalletCopyState('error')
      setWalletCopyError('Clipboard access is unavailable in this browser.')
      return
    }

    try {
      await navigator.clipboard.writeText(address)
      setWalletCopyState('copied')
      setWalletCopyError('')
    } catch (copyError) {
      setWalletCopyState('error')
      const reason =
        copyError instanceof Error ? copyError.message : 'Clipboard permission was denied.'
      setWalletCopyError(`Unable to copy wallet address: ${reason}`)
    }
  }

  const isLoading =
    !!studentId && studentResult.studentId !== studentId
  const student = studentResult.studentId === studentId ? studentResult.data : null
  const error = studentResult.studentId === studentId ? studentResult.error : ''
  const disbursements = (student?.disbursements || []).filter(
    (item) => item.studentId === studentId,
  )
  const confirmingDisbursements = disbursements.filter((item) =>
    ['SUBMITTED', 'OUTCOME_PENDING', 'PROCESSING'].includes(
      (item.status || '').toUpperCase(),
    ),
  )
  const allowanceXRP =
    Number(student?.monthlyAllowanceXRP ?? student?.monthlyAllowance) || 0
  const allowanceZAR =
    Number(student?.monthlyAllowanceZARIndicative) ||
    allowanceXRP * XRP_TO_ZAR_DEMO_RATE
  const receivedDisbursements = disbursements
    .filter(
      (item) =>
        item.txHash &&
        ['VERIFIED', 'APPROVED_AND_EXECUTED', 'EXECUTED', 'SETTLED'].includes(
          (item.status || '').toUpperCase(),
        ),
    )
    .sort(
      (first, second) =>
        (Date.parse(second.timestamp || '') || 0) -
        (Date.parse(first.timestamp || '') || 0),
    )

  return (
    <main className="main-content">
      <PageHeader
        eyebrow="FUNDING ASSURANCE / BENEFICIARY"
        title="Student portal"
        description="A clear view of your funding, scheduled support, and verified ledger activity."
      />

      {error && (
        <div className="notice notice-error" role="status">
          <CircleAlert size={17} />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="portal-loading">
          <LoaderCircle className="spin" size={20} />
          Loading beneficiary details…
        </div>
      ) : student ? (
        <>
          <section className="bursary-card" aria-label="Digital bursary card">
            <div className="bursary-card-pattern" aria-hidden="true" />
            <div className="bursary-card-top">
              <div className="bursary-brand">
                <span className="bursary-brand-mark">
                  <Waves size={19} />
                </span>
                <span>
                  <strong>FundFlow</strong>
                  <small>STUDENT BURSARY</small>
                </span>
              </div>
              <StatusBadge status={student.status || 'ACTIVE'} />
            </div>

            <div className="bursary-card-balance">
              <span className="bursary-balance-label">MONTHLY BURSARY ALLOWANCE</span>
              <strong className="bursary-balance-xrp">
                {formatCurrency(allowanceXRP, 'XRP', 2)}
              </strong>
              <span className="bursary-balance-rlusd">
                ≈ {formatCurrency(allowanceZAR, 'ZAR', 2)} ·{' '}
                {formatCurrency(allowanceZAR / ZAR_PER_RLUSD, 'RLUSD', 2)}
              </span>
              <small className="bursary-rate-note">
                Indicative demo conversion · 10 XRP = R1,650.00 · 1 RLUSD = R18.00
              </small>
            </div>

            <div className="bursary-card-footer">
              <div className="bursary-card-owner">
                <small>BENEFICIARY</small>
                <strong>{student.fullName}</strong>
                <span>{student.institution}</span>
                <span className="bursary-student-id">{student.studentId}</span>
              </div>
              <div className="bursary-card-wallet">
                <small>XRPL WALLET</small>
                <div className="bursary-wallet-row">
                  <strong title={student.walletAddress || undefined}>
                    {truncateWallet(student.walletAddress) || 'Wallet not registered'}
                  </strong>
                  <button
                    className="wallet-copy-button"
                    type="button"
                    disabled={!student.walletAddress}
                    onClick={() => handleCopyWallet(student.walletAddress)}
                    aria-label={
                      walletCopyState === 'copied'
                        ? 'Wallet address copied'
                        : 'Copy full XRPL wallet address'
                    }
                    title="Copy full wallet address"
                  >
                    {walletCopyState === 'copied' ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                    {walletCopyState === 'copied' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {walletCopyError && (
                  <span className="wallet-copy-error" role="alert">
                    {walletCopyError}
                  </span>
                )}
              </div>
              <div className="middleman-fee-badge">
                <BadgeCheck size={17} />
                <span>
                  <strong>R0.00 Middleman Fee</strong>
                  <small>VERIFIED · NO DEDUCTIONS</small>
                </span>
              </div>
            </div>
          </section>

          <section className="panel student-disbursements">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">XRPL PAYMENT ASSURANCE</div>
                <h2>Received disbursements</h2>
              </div>
              <span className="panel-count">
                {receivedDisbursements.length}{' '}
                {receivedDisbursements.length === 1 ? 'payment' : 'payments'}
              </span>
            </div>
            {confirmingDisbursements.length > 0 && (
              <div className="confirming-list" role="status" aria-live="polite">
                {confirmingDisbursements.map((disbursement) => (
                  <div
                    className="confirming-list-item"
                    key={disbursement.scheduleId}
                  >
                    <span>{disbursement.scheduleId}</span>
                    <StatusBadge status={disbursement.status} />
                  </div>
                ))}
              </div>
            )}
            {receivedDisbursements.length ? (
              <ol className="disbursement-timeline">
                {receivedDisbursements.map((disbursement) => (
                  <li className="disbursement-timeline-item" key={disbursement.scheduleId}>
                    <span className="timeline-marker" aria-hidden="true">
                      <Check size={13} />
                    </span>
                    <div className="timeline-entry">
                      <div className="timeline-entry-main">
                        <div>
                          <strong>{disbursement.month || 'Bursary received'}</strong>
                          <span>
                            {formatDate(disbursement.timestamp, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <div className="timeline-amount">
                          <strong>
                            {formatCurrency(
                              disbursement.amountXRP ?? disbursement.amount,
                              'XRP',
                              2,
                            )}
                          </strong>
                          <span>
                            ≈{' '}
                            {formatCurrency(
                              (Number(disbursement.amountXRP ?? disbursement.amount) ||
                                0) * XRP_TO_ZAR_DEMO_RATE,
                              'ZAR',
                              2,
                            )}{' '}
                            ·{' '}
                            {formatCurrency(
                              ((Number(
                                disbursement.amountXRP ?? disbursement.amount,
                              ) || 0) *
                                XRP_TO_ZAR_DEMO_RATE) /
                                ZAR_PER_RLUSD,
                              'RLUSD',
                              2,
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="timeline-entry-footer">
                        <span className="mono-cell">{disbursement.scheduleId}</span>
                        <a
                          className="ledger-link"
                          href={
                            `https://testnet.xrpl.org/transactions/${encodeURIComponent(disbursement.txHash)}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          title={disbursement.txHash}
                        >
                          View XRPL receipt <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="timeline-empty">
                <span className="timeline-empty-icon">
                  <Clock3 size={18} />
                </span>
                <span>
                  <strong>No received disbursements yet</strong>
                  <small>Verified XRPL receipts will appear here after settlement.</small>
                </span>
              </div>
            )}
            <div className="student-assurance-note">
              <ShieldCheck size={17} />
              <span>
                Every received payment is independently verified on the XRPL Testnet ledger.
              </span>
            </div>
          </section>
        </>
      ) : (
        <section className="panel portal-empty">
          <span className="empty-icon">
            <UserRound size={24} />
          </span>
          <h2>Beneficiary account unavailable</h2>
          <p>
            {studentId
              ? 'Your beneficiary profile is unavailable. Contact your administrator.'
              : 'This account is not linked to a beneficiary profile.'}
          </p>
        </section>
      )}
    </main>
  )
}

function App() {
  const [session, setSession] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ff_session')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const sessionRole = session?.role
  const [activeView, setActiveView] = useState(
    () => getAllowedViews(session?.role)[0] || 'admin',
  )
  const [programmes, setProgrammes] = useState([])
  const [beneficiaries, setBeneficiaries] = useState([])
  const [schedules, setSchedules] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [triggerLogs, setTriggerLogs] = useState([])
  const [triggerResult, setTriggerResult] = useState(null)
  const [triggerError, setTriggerError] = useState('')
  const [policyTestResult, setPolicyTestResult] = useState(null)
  const [capOverrides, setCapOverrides] = useState({})
  const [whitelistOverrides, setWhitelistOverrides] = useState({})
  const [killSwitchOverride, setKillSwitchOverride] = useState(null)
  const [isTogglingKillSwitch, setIsTogglingKillSwitch] = useState(false)
  const [killSwitchError, setKillSwitchError] = useState('')
  const [dashboardError, setDashboardError] = useState('')
  const [demoResetNotice, setDemoResetNotice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isTriggering, setIsTriggering] = useState(false)
  const [isResettingDemo, setIsResettingDemo] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const apiMode = useSyncExternalStore(
    subscribeToApiMode,
    getApiMode,
    getApiMode,
  )
  const sessionRoleRef = useRef(sessionRole)

  function handleLogin(account) {
    const allowedViews = getAllowedViews(account.role)
    if (!allowedViews.length) return

    sessionStorage.setItem('ff_session', JSON.stringify(account))
    sessionRoleRef.current = account.role
    setSession(account)
    setIsLoading(account.role === 'cfo')
    setActiveView(
      allowedViews.includes(account.landingView)
        ? account.landingView
        : allowedViews[0],
    )
  }

  function handleLogout() {
    sessionStorage.removeItem('ff_session')
    sessionRoleRef.current = null
    setSession(null)
    setActiveView('admin')
    setIsLoading(false)
    setProgrammes([])
    setBeneficiaries([])
    setSchedules([])
    setAuditLogs([])
    setTriggerLogs([])
    setTriggerResult(null)
    setPolicyTestResult(null)
    setCapOverrides({})
    setWhitelistOverrides({})
    setKillSwitchOverride(null)
    setKillSwitchError('')
    setDashboardError('')
    setDemoResetNotice('')
  }

  function handleViewChange(view) {
    if (getAllowedViews(session?.role).includes(view)) {
      setActiveView(view)
    }
  }

  const applyDashboardResults = useCallback((results) => {
    const errors = []
    const setters = [
      [null, 'health status'],
      [setProgrammes, 'programmes'],
      [setBeneficiaries, 'beneficiaries'],
      [setSchedules, 'schedules'],
      [setAuditLogs, 'audit logs'],
    ]

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (setters[index][0]) setters[index][0](result.value)
      } else {
        errors.push(`${setters[index][1]}: ${result.reason.message}`)
      }
    })

    setDashboardError(errors.join(' · '))
    setLastUpdated(new Date())
    setIsLoading(false)
    setIsRefreshing(false)
  }, [])

  const refreshDashboard = useCallback(
    async (showSpinner = true) => {
      if (sessionRole !== 'cfo') return
      if (showSpinner) setIsRefreshing(true)
      const results = await fetchDashboardData()
      if (sessionRoleRef.current !== 'cfo') return
      applyDashboardResults(results)
    },
    [applyDashboardResults, sessionRole],
  )

  const refreshAudit = useCallback(async () => {
    if (sessionRole !== 'cfo' && sessionRole !== 'auditor') return
    try {
      const logs = await getAuditLogs()
      if (
        sessionRoleRef.current !== 'cfo' &&
        sessionRoleRef.current !== 'auditor'
      ) {
        return
      }
      setAuditLogs(logs)
      setLastUpdated(new Date())
    } catch (error) {
      setDashboardError((current) =>
        current ? current : `Audit logs: ${error.message}`,
      )
    }
  }, [sessionRole])

  useEffect(() => {
    if (!sessionRole) {
      return undefined
    }

    let active = true
    if (sessionRole === 'cfo') {
      fetchDashboardData().then((results) => {
        if (active) applyDashboardResults(results)
      })
    } else if (sessionRole === 'auditor') {
      getAuditLogs()
        .then((logs) => {
          if (!active) return
          setAuditLogs(logs)
          setLastUpdated(new Date())
          setDashboardError('')
        })
        .catch((error) => {
          if (active) setDashboardError(`Audit logs: ${error.message}`)
        })
    }

    if (sessionRole === 'cfo' || sessionRole === 'auditor') {
      const intervalId = window.setInterval(() => {
        if (active) refreshAudit()
      }, REFRESH_INTERVAL)
      return () => {
        active = false
        window.clearInterval(intervalId)
      }
    }
    return () => {
      active = false
    }
  }, [sessionRole, applyDashboardResults, refreshAudit])

  const visibleAuditLogs = useMemo(() => {
    const combined = [...triggerLogs, ...auditLogs]
    return combined.filter(
      (entry, index) =>
        combined.findIndex(
          (candidate) =>
            candidate._id === entry._id ||
            (entry.decisionId &&
              candidate.decisionId === entry.decisionId),
        ) === index,
    )
  }, [auditLogs, triggerLogs])

  const killSwitchActive =
    killSwitchOverride ?? Boolean(programmes[0]?.isPaused)
  const connectionStatus = {
    CONNECTING: { label: 'API Connecting', className: 'is-connecting' },
    LIVE: { label: 'API Live', className: 'is-online' },
    MOCK: { label: 'API Mock', className: 'is-mock' },
    OFFLINE: { label: 'API Offline', className: 'is-offline' },
  }[apiMode]

  function handleCapChange(studentId, value) {
    setCapOverrides((current) => ({ ...current, [studentId]: value }))
  }

  function handleWhitelistChange(studentId, isApproved) {
    setWhitelistOverrides((current) => ({
      ...current,
      [studentId]: isApproved,
    }))
  }

  async function handleToggleKillSwitch() {
    if (session?.role !== 'cfo') return
    const programme = programmes[0]
    if (!programme?._id) {
      setKillSwitchError('No programme is available to pause.')
      return
    }

    setIsTogglingKillSwitch(true)
    setKillSwitchError('')
    try {
      const result = await toggleProgrammePause(
        programme._id,
        programme.programmeId,
        killSwitchActive,
      )
      setKillSwitchOverride(Boolean(result.isPaused))
    } catch (error) {
      setKillSwitchError(error.message)
    } finally {
      setIsTogglingKillSwitch(false)
    }
  }

  async function handleResetDemo() {
    if (session?.role !== 'cfo' || isTriggering || isResettingDemo) return

    setIsResettingDemo(true)
    setDemoResetNotice('')
    setDashboardError('')
    setTriggerError('')
    setKillSwitchError('')
    try {
      const result = await resetDemo()
      if (result.success === false) {
        throw new Error(result.message || 'The demo reset was rejected.')
      }

      setTriggerLogs([])
      setTriggerResult(null)
      setPolicyTestResult(null)
      setCapOverrides({})
      setWhitelistOverrides({})
      setKillSwitchOverride(null)
      await refreshDashboard(false)
      setDemoResetNotice(result.message || 'Demo data reset to its initial state.')
    } catch (error) {
      setDashboardError(`Unable to reset demo data: ${error.message}`)
    } finally {
      setIsResettingDemo(false)
    }
  }

  async function ensurePolicyFixture({
    budgetScenario = false,
    studentId = budgetScenario ? DEMO_BUDGET_STUDENT_ID : DEMO_STUDENT_ID,
  } = {}) {
    const [currentProgrammes, currentBeneficiaries] = await Promise.all([
      getProgrammes(),
      getBeneficiaries(),
    ])
    const programmeName = budgetScenario
      ? DEMO_BUDGET_PROGRAMME_NAME
      : DEMO_PROGRAMME_NAME
    let programme = currentProgrammes.find((item) => item.name === programmeName)
    if (!programme) {
      programme = await createProgramme({
        name: programmeName,
        sponsor: 'FundFlow Testnet Policy Scenarios',
        totalBudget: budgetScenario ? 1 : 50000,
      })
    }

    let beneficiary = currentBeneficiaries.find(
      (item) => item.studentId === studentId,
    )
    if (!beneficiary) {
      beneficiary = await createBeneficiary({
        studentId,
        fullName: budgetScenario
          ? 'FundFlow Budget Scenario'
          : 'FundFlow Policy Scenario',
        institution: 'FundFlow Testnet Demo',
        monthlyAllowance: 10,
        programmeId: programme.programmeId,
      })
    }

    const walletAddress =
      currentBeneficiaries.find(
        (item) => item.walletAddress && item.walletAddress.startsWith('r'),
      )?.walletAddress || DEMO_WALLET_ADDRESS
    beneficiary = await updateBeneficiary(beneficiary.studentId, {
      walletAddress,
      monthlyAllowance: 10,
    })

    const currentSchedules = await getSchedules()
    const schedule = currentSchedules.find(
      (item) =>
        item.studentId === studentId &&
        item.programmeId === programme.programmeId,
    )
    if (!schedule) {
      throw new Error(`No schedule was created for demo beneficiary ${studentId}.`)
    }

    return { programme, beneficiary, schedule }
  }

  function makeScenarioAuditEntry(payload, result) {
    return {
      _id: result.decisionId || `policy-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'POLICY_SCENARIO_TEST',
      studentId: payload.studentId,
      programmeId: payload.programmeId,
      amount: payload.amount,
      policyDecision: result.approved && result.executed ? 'APPROVED' : 'REJECTED',
      decisionId: result.decisionId,
      policyVersion: result.policyVersion,
      reasonCode: result.reasonCode || null,
      rejectionReason: result.reasonCode || null,
      message: result.message || result.error || null,
      txHash: result.txHash || null,
      explorerUrl: result.explorerUrl || null,
      ledgerResult: result.txHash ? 'tesSUCCESS' : null,
    }
  }

  async function handleRunPolicyScenario(scenario) {
    if (session?.role !== 'cfo') return
    setIsTriggering(true)
    setTriggerError('')
    setPolicyTestResult(null)
    let payload
    let result
    let pauseToRestore = null

    try {
      let fixture
      let scenarioLabel
      if (scenario === 'unapproved-recipient') {
        fixture = await ensurePolicyFixture()
        scenarioLabel = 'Unapproved Recipient'
        const requestId = Date.now()
        payload = {
          programmeId: fixture.programme.programmeId,
          studentId: `STU-UNAPPROVED-${requestId}`,
          amount: 10,
          scheduleId: `SCH-UNAPPROVED-${requestId}`,
        }
      } else {
        fixture = await ensurePolicyFixture({
          budgetScenario: scenario === 'budget',
          studentId:
            scenario === 'duplicate'
              ? DEMO_DUPLICATE_STUDENT_ID
              : scenario === 'student-limit'
                ? DEMO_CAP_STUDENT_ID
                : scenario === 'paused-programme'
                  ? DEMO_PAUSED_STUDENT_ID
                  : DEMO_STUDENT_ID,
        })
        scenarioLabel = {
          'valid-payment': 'Valid Run',
          duplicate: 'Duplicate Allowance',
          'student-limit': 'Student Limit Exceeded',
          budget: 'Budget Exceeded',
          'paused-programme': 'Paused Programme',
        }[scenario]

        if (scenario === 'valid-payment') {
          const settled =
            fixture.schedule.status === 'VERIFIED' || fixture.schedule.txHash
          if (settled) {
            fixture = await ensurePolicyFixture({
              studentId: `${DEMO_STUDENT_ID}-${Date.now()}`,
            })
          }
          payload = {
            programmeId: fixture.programme.programmeId,
            studentId: fixture.beneficiary.studentId,
            amount: Number(fixture.beneficiary.monthlyAllowance),
            scheduleId: fixture.schedule.scheduleId,
          }
        } else if (scenario === 'duplicate') {
          payload = {
            programmeId: fixture.programme.programmeId,
            studentId: fixture.beneficiary.studentId,
            amount: Number(fixture.beneficiary.monthlyAllowance),
            scheduleId: fixture.schedule.scheduleId,
          }
          const isSettled =
            fixture.schedule.status === 'VERIFIED' || fixture.schedule.txHash
          if (!isSettled) {
            const firstPayment = await validateAndPay(payload)
            if (!firstPayment.approved || !firstPayment.executed) {
              throw new Error(
                firstPayment.message ||
                  firstPayment.reasonCode ||
                  'Could not settle the demo payment before testing replay protection.',
              )
            }
          }
        } else if (scenario === 'student-limit') {
          payload = {
            programmeId: fixture.programme.programmeId,
            studentId: fixture.beneficiary.studentId,
            amount: Number(fixture.beneficiary.monthlyAllowance) + 1,
            scheduleId: fixture.schedule.scheduleId,
          }
        } else if (scenario === 'budget') {
          payload = {
            programmeId: fixture.programme.programmeId,
            studentId: fixture.beneficiary.studentId,
            amount: Number(fixture.beneficiary.monthlyAllowance),
            scheduleId: fixture.schedule.scheduleId,
          }
        } else if (scenario === 'paused-programme') {
          if (!fixture.programme.isPaused) {
            const paused = await toggleProgrammePause(
              fixture.programme._id,
              fixture.programme.programmeId,
              false,
            )
            if (!paused.isPaused) {
              throw new Error('The demo programme could not be paused.')
            }
            pauseToRestore = fixture.programme
          }
          payload = {
            programmeId: fixture.programme.programmeId,
            studentId: fixture.beneficiary.studentId,
            amount: Number(fixture.beneficiary.monthlyAllowance),
            scheduleId: fixture.schedule.scheduleId,
          }
        }
      }

      result = await validateAndPay(payload)
      const expectedApproval = scenario === 'valid-payment'
      const expectedReasonCode = {
        duplicate: 'ERR_DUPLICATE_PAYMENT',
        'student-limit': 'ERR_EXCEEDS_STUDENT_ALLOWANCE_CAP',
        budget: 'ERR_INSUFFICIENT_PROGRAMME_BUDGET',
        'unapproved-recipient': 'ERR_UNAUTHORIZED_BENEFICIARY',
        'paused-programme': 'ERR_PROGRAMME_PAUSED',
      }[scenario]
      const decisionMatchesScenario = expectedApproval
        ? Boolean(result.approved && result.executed)
        : result.approved === false &&
          result.reasonCode === expectedReasonCode
      if (!decisionMatchesScenario) {
        throw new Error(
          result.message ||
            result.reasonCode ||
            `The live policy engine returned an unexpected result for ${scenarioLabel}.`,
        )
      }

      const event = makeScenarioAuditEntry(payload, result)
      setPolicyTestResult({
        scenarioLabel,
        approved: Boolean(result.approved && result.executed),
        message:
          result.message ||
          result.error ||
          (result.reasonCode
            ? `Request rejected: ${result.reasonCode}`
            : 'Payment settled successfully on XRPL Testnet.'),
        decisionId: result.decisionId,
        policyVersion: result.policyVersion,
        reasonCode: result.reasonCode,
        txHash: result.txHash,
      })
      setTriggerLogs((current) => [event, ...current])
      setSchedules((current) =>
        current.map((item) =>
          item.scheduleId === payload.scheduleId
            ? {
                ...item,
                status:
                  result.approved && result.executed ? 'VERIFIED' : 'REJECTED',
                txHash: result.txHash || item.txHash || null,
                rejectionReason: result.reasonCode || null,
                decisionId: result.decisionId,
                policyVersion: result.policyVersion,
                reasonCode: result.reasonCode || null,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )
    } catch (error) {
      setTriggerError(error.message)
    } finally {
      if (pauseToRestore) {
        try {
          await toggleProgrammePause(
            pauseToRestore._id,
            pauseToRestore.programmeId,
            true,
          )
        } catch (error) {
          setTriggerError((current) =>
            current
              ? `${current} · Unable to resume the demo programme: ${error.message}`
              : `Unable to resume the demo programme: ${error.message}`,
          )
        }
      }
      await refreshDashboard(false)
      setIsTriggering(false)
    }
  }

  async function handleAgentTrigger() {
    if (session?.role !== 'cfo' || killSwitchActive) return
    setIsTriggering(true)
    setTriggerError('')
    try {
      const result = await triggerAgent()
      const processed = Array.isArray(result.results)
        ? result.results
        : Array.isArray(result.processed)
          ? result.processed
          : []
      setTriggerResult(result)
      setSchedules((current) =>
        current.map((schedule) => {
          const outcome = processed.find(
            (item) => item.scheduleId === schedule.scheduleId,
          )
          if (!outcome) return schedule
          return {
            ...schedule,
            status:
              outcome.status === 'APPROVED_AND_EXECUTED'
                ? 'VERIFIED'
                : outcome.status === 'REJECTED_BY_POLICY'
                  ? 'REJECTED'
                  : outcome.status === 'LEDGER_FAILED'
                    ? 'FAILED'
                  : outcome.status,
            txHash: outcome.txHash || schedule.txHash || null,
            rejectionReason: outcome.reasonCode || outcome.reason || null,
            decisionId: outcome.decisionId || null,
            policyVersion: outcome.policyVersion || null,
            reasonCode: outcome.reasonCode || null,
            updatedAt: new Date().toISOString(),
          }
        }),
      )
      setTriggerLogs((current) => [
        ...processed.map((item) => ({
          _id: `${result.cycleId}-${item.scheduleId}`,
          timestamp: new Date().toISOString(),
          eventType: 'DISBURSEMENT_ATTEMPT',
          studentId: item.studentId,
          programmeId:
            programmes[0]?.programmeId || 'PRG-WE-THINK-CODE-2026',
          amount: item.amount,
          policyDecision: item.status.includes('REJECTED')
            ? 'REJECTED'
            : 'APPROVED',
          rejectionReason: item.reason || null,
          reasonCode: item.reasonCode || null,
          decisionId: item.decisionId || null,
          policyVersion: item.policyVersion || null,
          txHash: item.txHash || null,
          explorerUrl: item.explorerUrl || null,
          ledgerResult: item.txHash ? 'tesSUCCESS' : null,
        })),
        ...current,
      ])
      await refreshDashboard(false)
    } catch (error) {
      setTriggerError(error.message)
    } finally {
      setIsTriggering(false)
    }
  }

  const allowedViews = getAllowedViews(session?.role)
  if (!session || allowedViews.length === 0) {
    return <AuthScreen onLogin={handleLogin} />
  }

  const visibleView = allowedViews.includes(activeView)
    ? activeView
    : allowedViews[0]
  const ROLE_COLORS = { cfo: '#1d4ed8', student: '#047857', auditor: '#7c3aed' }
  const ROLE_SHORT_LABELS = { cfo: 'CFO', student: 'Student', auditor: 'Auditor' }
  const userColor = ROLE_COLORS[session.role] || '#1d4ed8'
  const userLabel = `${String(session.name || session.email || 'User').split(' ')[0]} · ${
    ROLE_SHORT_LABELS[session.role] || session.role
  }`
  const navItems = [
    { id: 'admin', label: 'CFO Admin Console', Icon: LayoutDashboard },
    { id: 'analytics', label: 'Treasury & Savings', Icon: TrendingUp },
    { id: 'auditor', label: 'Auditor General Hub', Icon: FileCheck2 },
    { id: 'student', label: 'Student Portal', Icon: UserRound },
  ]

  return (
    <div className="app-shell">
      <div className="workspace">
        <div className="topbar">
          <div className="topbar-brand">
            <span className="topbar-brand-mark" aria-hidden="true">
              <Waves size={21} strokeWidth={2.2} />
            </span>
            <span className="topbar-brand-copy">
              <strong>FundFlow</strong>
              <span>Every approved rand. Accounted for.</span>
            </span>
          </div>
          <nav className="view-switcher" aria-label="Workspace navigation">
            {navItems
              .filter(({ id }) => allowedViews.includes(id))
              .map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={`view-switcher-button ${visibleView === id ? 'active' : ''}`}
                  type="button"
                  aria-current={visibleView === id ? 'page' : undefined}
                  onClick={() => handleViewChange(id)}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
          </nav>
          <div className="topbar-actions">
            <span
              className="xrpl-status-pill"
              role="status"
              title="This workspace is configured for XRPL Testnet."
            >
              <span className="xrpl-status-dot" />
              XRPL Testnet
            </span>
            <span
              className={`environment-pill ${connectionStatus.className}`}
              role="status"
              aria-live="polite"
              title="Connection mode reflects live API responses and mock fallbacks."
            >
              <span />
              {connectionStatus.label}
            </span>
            {session.role === 'cfo' && (
              <button
              className={`header-kill-switch ${killSwitchActive ? 'engaged' : ''}`}
              type="button"
              role="switch"
              aria-checked={killSwitchActive}
              aria-label={`Authorisations: ${killSwitchActive ? 'Paused' : 'Active'}`}
              aria-busy={isTogglingKillSwitch}
              disabled={isTogglingKillSwitch || !programmes[0]?._id}
              onClick={handleToggleKillSwitch}
              title={
                killSwitchError ||
                (!programmes[0]?._id
                  ? 'Pause unavailable: no programme is available.'
                  : 'Stops new payment signing and authorisations. It does not reverse transactions already settled on XRPL.')
              }
            >
              <span className="header-kill-copy">
                <strong>
                  {isTogglingKillSwitch
                    ? 'Updating…'
                    : `Authorisations: ${killSwitchActive ? 'Paused' : 'Active'}`}
                </strong>
              </span>
              <span className="header-kill-track" aria-hidden="true">
                <span />
              </span>
              </button>
            )}
            <div className="topbar-user-actions">
              <span className="user-pill">
                <span className="user-pill-avatar" style={{ background: userColor }}>
                  {session.initials}
                </span>
                <span className="user-pill-label">{userLabel}</span>
              </span>
              <button
                className="user-logout-btn"
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
              >
                <Power size={13} />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {visibleView === 'admin' ? (
          <AdminDashboard
            programmes={programmes}
            beneficiaries={beneficiaries}
            schedules={schedules}
            auditLogs={visibleAuditLogs}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            isTriggering={isTriggering || isResettingDemo}
            triggerResult={triggerResult}
            triggerError={triggerError}
            policyTestResult={policyTestResult}
            capOverrides={capOverrides}
            onCapChange={handleCapChange}
            whitelistOverrides={whitelistOverrides}
            onWhitelistChange={handleWhitelistChange}
            killSwitchActive={killSwitchActive}
            onToggleKillSwitch={handleToggleKillSwitch}
            isTogglingKillSwitch={isTogglingKillSwitch}
            killSwitchError={killSwitchError}
            dashboardError={dashboardError}
            demoResetNotice={demoResetNotice}
            lastUpdated={lastUpdated}
            onRefresh={() => refreshDashboard(true)}
            onResetDemo={handleResetDemo}
            onTrigger={handleAgentTrigger}
            onRunPolicyScenario={handleRunPolicyScenario}
            isResettingDemo={isResettingDemo}
          />
        ) : visibleView === 'analytics' ? (
          <AnalyticsDashboard />
        ) : visibleView === 'auditor' ? (
          <AuditorPortal auditLogs={visibleAuditLogs} />
        ) : (
          <StudentPortal session={session} />
        )}

        <footer className="app-footer">
          <span>FundFlow · Every approved rand. Accounted for.</span>
          <span>
            <span className="footer-ledger-dot" />
            XRPL Testnet
          </span>
        </footer>
      </div>
    </div>
  )
}

export default App
