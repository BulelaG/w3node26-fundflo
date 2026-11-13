import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileCheck2,
  LayoutDashboard,
  LoaderCircle,
  Power,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
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
  subscribeToApiMode,
  triggerAgent,
  toggleProgrammePause,
} from './services/api.js'
import './App.css'

const REFRESH_INTERVAL = 30000

function fetchDashboardData() {
  return Promise.allSettled([
    getHealth(),
    getProgrammes(),
    getBeneficiaries(),
    getSchedules(),
    getAuditLogs(),
  ])
}

function formatCurrency(value, currency = 'XRP') {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
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

function getStudentCap(student, overrides) {
  const override = overrides[student.studentId]
  if (override === undefined || override === '') {
    return Number(student.monthlyAllowance) || 0
  }
  const parsed = Number(override)
  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : Number(student.monthlyAllowance) || 0
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

function IconButton({ children, className = '', ...props }) {
  return (
    <button className={`icon-button ${className}`} {...props}>
      {children}
    </button>
  )
}

function Sidebar({ activeView, onNavigate, apiOnline }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#" onClick={(event) => event.preventDefault()}>
        <span className="brand-mark">
          <Waves size={22} strokeWidth={2.2} />
        </span>
        <span className="brand-copy">
          <strong>fundflow</strong>
          <span>DISBURSEMENT ASSURANCE</span>
        </span>
      </a>

      <div className="sidebar-label">WORKSPACE</div>
      <nav className="primary-nav" aria-label="Main navigation">
        <button
          className={`nav-item ${activeView === 'admin' ? 'active' : ''}`}
          onClick={() => onNavigate('admin')}
          aria-current={activeView === 'admin' ? 'page' : undefined}
        >
          <LayoutDashboard size={18} />
          <span>Admin dashboard</span>
          <span className="nav-shortcut">01</span>
        </button>
        <button
          className={`nav-item ${activeView === 'student' ? 'active' : ''}`}
          onClick={() => onNavigate('student')}
          aria-current={activeView === 'student' ? 'page' : undefined}
        >
          <UserRound size={18} />
          <span>Student portal</span>
          <span className="nav-shortcut">02</span>
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="network-card">
          <div className="network-card-top">
            <span className="network-icon">
              <Activity size={17} />
            </span>
            <span className={`network-dot ${apiOnline ? 'online' : ''}`} />
          </div>
          <strong>{apiOnline ? 'API connected' : 'Demo workspace'}</strong>
          <span>XRPL Testnet environment</span>
          <div className="network-line">
            <span>Network status</span>
            <span>{apiOnline ? 'Online' : 'Mock data'}</span>
          </div>
        </div>
        <div className="sidebar-user">
          <span className="avatar avatar-admin">AM</span>
          <span className="sidebar-user-copy">
            <strong>Admin workspace</strong>
            <span>FundFlow CFO</span>
          </span>
          <ChevronDown size={16} />
        </div>
      </div>
    </aside>
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
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-detail">{detail}</div>
    </article>
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
          <strong>
            {formatCurrency(programme.remainingBudget, programme.currency)}
          </strong>
        </div>
        <div className="budget-total">
          <span>Total mandate</span>
          <strong>
            {formatCurrency(programme.totalBudget, programme.currency)}
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
          <h3>Emergency Agent Kill-Switch</h3>
          <p>
            {killSwitchActive
              ? 'Autonomous payment cycles are halted until the mandate is resumed.'
              : 'Pause the mandate to prevent the agent from starting new payment cycles.'}
          </p>
          <div className="kill-switch-action">
            <span>{killSwitchActive ? 'Agent execution halted' : 'Agent execution allowed'}</span>
            <button
              className={`switch-control ${killSwitchActive ? 'on' : ''}`}
              type="button"
              role="switch"
              aria-checked={killSwitchActive}
              aria-label="Toggle emergency Agent Kill-Switch"
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
            Toggle is backed by the programme pause endpoint. Settled ledger
            transactions cannot be reversed.
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
  onTestPolicyBlock,
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
          className="policy-test-result"
          role="alert"
          aria-live="assertive"
        >
          <span className="policy-test-result-icon">
            <ShieldCheck size={16} />
          </span>
          <span>
            <strong>INDEPENDENT POLICY ENGINE · REJECTED</strong>
            <small>
              Mock request {policyTestResult.scheduleId} for{' '}
              {policyTestResult.studentId}: {formatCurrency(policyTestResult.amount)}{' '}
              exceeds the {formatCurrency(policyTestResult.cap)} student cap.
            </small>
            <code>Audit reason: {policyTestResult.reason}</code>
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
          onClick={onTestPolicyBlock}
          disabled={isRunning}
        >
          <ShieldCheck size={15} />
          Simulate Policy Violation
        </button>
      </div>
      <div className="agent-footnote">
        <ShieldCheck size={14} />
        Simulation only — no payment is submitted
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
                      {formatCurrency(schedule.amount, currency)}
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
                    <span>{formatCurrency(entry.amount, currency)}</span>
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
  lastUpdated,
  onRefresh,
  onTrigger,
  onTestPolicyBlock,
}) {
  const programme = programmes[0]
  const pendingCount = schedules.filter((item) =>
    (item.status || '').toLowerCase().includes('pending'),
  ).length
  const currency = programme?.currency || 'XRP'

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
              disabled={isRefreshing}
            >
              <RefreshCw className={isRefreshing ? 'spin' : ''} size={16} />
              Refresh
            </button>
          </>
        }
      />

      {dashboardError && (
        <div className="notice notice-error" role="status">
          <CircleAlert size={17} />
          <span>{dashboardError}</span>
        </div>
      )}

      <div className="metrics-grid">
        <MetricCard
          label="Total programme budget"
          value={programme ? formatCurrency(programme.totalBudget, currency) : '—'}
          detail={programme?.name || 'No active programme'}
          icon={Wallet}
          tone="blue"
        />
        <MetricCard
          label="Available to disburse"
          value={
            programme
              ? formatCurrency(programme.remainingBudget, currency)
              : '—'
          }
          detail="Remaining mandate balance"
          icon={CircleAlert}
          tone="mint"
        />
        <MetricCard
          label="Active beneficiaries"
          value={
            programme?.beneficiaryCount ??
            beneficiaries.filter((student) => student.status === 'ACTIVE').length
          }
          detail="Whitelisted students"
          icon={Users}
          tone="violet"
        />
        <MetricCard
          label={killSwitchActive ? 'Scheduled runs halted' : 'Pending schedules'}
          value={pendingCount}
          detail={
            killSwitchActive
              ? 'Emergency kill-switch engaged'
              : 'Awaiting agent evaluation'
          }
          icon={Clock3}
          tone="amber"
        />
      </div>

      <div className="overview-grid">
        <ProgrammeCard programme={programme} isPaused={killSwitchActive} />
        <AgentCard
          isRunning={isTriggering}
          triggerResult={triggerResult}
          onTrigger={onTrigger}
          onTestPolicyBlock={onTestPolicyBlock}
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

function StudentPortal({ beneficiaries, isLoadingBeneficiaries }) {
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const studentId = selectedStudentId || beneficiaries[0]?.studentId || ''
  const [studentResult, setStudentResult] = useState({
    studentId: '',
    data: null,
    error: '',
  })

  useEffect(() => {
    if (!studentId) return undefined

    let active = true
    getStudentStatus(studentId)
      .then((response) => {
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

  const isLoading =
    !!studentId && studentResult.studentId !== studentId
  const student = studentResult.studentId === studentId ? studentResult.data : null
  const error = studentResult.studentId === studentId ? studentResult.error : ''
  const disbursements = student?.disbursements || []
  const verifiedCount = disbursements.filter((item) =>
    ['VERIFIED', 'APPROVED_AND_EXECUTED'].includes(item.status),
  ).length

  return (
    <main className="main-content">
      <PageHeader
        eyebrow="FUNDING ASSURANCE / BENEFICIARY"
        title="Student portal"
        description="A clear view of your funding, scheduled support, and verified ledger activity."
        actions={
          <label className="student-select-wrap">
            <span className="sr-only">Select beneficiary</span>
            <Users size={16} />
            <select
              value={studentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              disabled={isLoadingBeneficiaries || !beneficiaries.length}
            >
              {!beneficiaries.length && <option value="">No beneficiaries</option>}
              {beneficiaries.map((beneficiary) => (
                <option key={beneficiary.studentId} value={beneficiary.studentId}>
                  {beneficiary.fullName}
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </label>
        }
      />

      {error && (
        <div className="notice notice-error" role="status">
          <CircleAlert size={17} />
          <span>{error}</span>
        </div>
      )}

      {isLoading || isLoadingBeneficiaries ? (
        <div className="portal-loading">
          <LoaderCircle className="spin" size={20} />
          Loading beneficiary details…
        </div>
      ) : student ? (
        <>
          <section className="student-welcome">
            <div className="student-welcome-pattern" />
            <div className="student-welcome-content">
              <div className="student-welcome-avatar">
                {student.fullName
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div>
                <span className="student-kicker">BENEFICIARY ACCOUNT</span>
                <h2>Welcome, {student.fullName.split(' ')[0]}</h2>
                <p>{student.institution}</p>
              </div>
              <StatusBadge status="ACTIVE" />
            </div>
            <div className="student-id-tag">
              <span>STUDENT ID</span>
              <strong>{student.studentId}</strong>
            </div>
          </section>

          <div className="student-metrics">
            <MetricCard
              label="Monthly allowance"
              value={formatCurrency(student.monthlyAllowance)}
              detail="Your approved monthly support"
              icon={Wallet}
              tone="blue"
            />
            <MetricCard
              label="Verified payments"
              value={verifiedCount}
              detail="Confirmed on XRPL Testnet"
              icon={BadgeCheck}
              tone="mint"
            />
            <article className="wallet-card">
              <div className="wallet-card-heading">
                <span className="metric-icon metric-violet">
                  <ShieldCheck size={18} />
                </span>
                <span>REGISTERED XRPL WALLET</span>
              </div>
              <strong title={student.walletAddress}>{student.walletAddress}</strong>
              <span className="wallet-caption">
                <span className="network-dot online" />
                Linked to your beneficiary profile
              </span>
            </article>
          </div>

          <section className="panel student-disbursements">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">PAYMENT ASSURANCE</div>
                <h2>Disbursement history</h2>
              </div>
              <span className="panel-count">
                {disbursements.length} {disbursements.length === 1 ? 'payment' : 'payments'}
              </span>
            </div>
            {disbursements.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Schedule ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Ledger proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disbursements.map((disbursement) => (
                      <tr key={disbursement.scheduleId}>
                        <td>
                          <strong>{disbursement.month || 'Upcoming'}</strong>
                          {disbursement.timestamp && (
                            <small className="table-subtext">
                              {formatDate(disbursement.timestamp, {
                                dateStyle: 'medium',
                              })}
                            </small>
                          )}
                        </td>
                        <td className="mono-cell">{disbursement.scheduleId}</td>
                        <td className="amount-cell">
                          {formatCurrency(disbursement.amount)}
                        </td>
                        <td>
                          <StatusBadge status={disbursement.status} />
                        </td>
                        <td>
                          {disbursement.txHash ? (
                            <a
                              className="ledger-link"
                              href={
                                disbursement.xrplExplorerUrl ||
                                `https://testnet.xrpl.org/transactions/${disbursement.txHash}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              title={disbursement.txHash}
                            >
                              View transaction <ExternalLink size={13} />
                            </a>
                          ) : (
                            <span className="muted-cell">Awaiting settlement</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                No disbursement records are available for this account yet.
              </div>
            )}
            <div className="student-assurance-note">
              <ShieldCheck size={17} />
              <span>
                Every completed payment is independently verified on the XRPL
                Testnet ledger.
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
            {beneficiaries.length
              ? 'Select a student account to view funding details.'
              : 'Beneficiary records will appear here when available.'}
          </p>
        </section>
      )}
    </main>
  )
}

function App() {
  const [activeView, setActiveView] = useState('admin')
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
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isTriggering, setIsTriggering] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const apiMode = useSyncExternalStore(
    subscribeToApiMode,
    getApiMode,
    getApiMode,
  )

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
      if (showSpinner) setIsRefreshing(true)
      const results = await fetchDashboardData()
      applyDashboardResults(results)
    },
    [applyDashboardResults],
  )

  const refreshAudit = useCallback(async () => {
    try {
      setAuditLogs(await getAuditLogs())
      setLastUpdated(new Date())
    } catch (error) {
      setDashboardError((current) =>
        current ? current : `Audit logs: ${error.message}`,
      )
    }
  }, [])

  useEffect(() => {
    fetchDashboardData().then(applyDashboardResults)
    const intervalId = window.setInterval(refreshAudit, REFRESH_INTERVAL)
    return () => window.clearInterval(intervalId)
  }, [applyDashboardResults, refreshAudit])

  const visibleAuditLogs = useMemo(() => {
    const combined = [...triggerLogs, ...auditLogs]
    return combined.filter(
      (entry, index) =>
        combined.findIndex((candidate) => candidate._id === entry._id) === index,
    )
  }, [auditLogs, triggerLogs])

  const killSwitchActive =
    killSwitchOverride ?? Boolean(programmes[0]?.isPaused)
  const connectionStatus = {
    CONNECTING: { label: 'CONNECTING TO API', className: 'is-connecting' },
    LIVE: { label: 'LIVE EXPRESS API', className: 'is-online' },
    MOCK: { label: 'MOCK DEMO MODE', className: 'is-mock' },
    OFFLINE: { label: 'API OFFLINE', className: 'is-offline' },
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

  function handleSimulatePolicyViolation() {
    const overLimitSchedule = schedules.find((schedule) => {
      const student = beneficiaries.find(
        (beneficiary) => beneficiary.studentId === schedule.studentId,
      )
      return student
        ? Number(schedule.amount) > getStudentCap(student, capOverrides)
        : false
    })
    const schedule = overLimitSchedule || schedules[0]
    const student =
      beneficiaries.find(
        (beneficiary) => beneficiary.studentId === schedule?.studentId,
      ) || beneficiaries[0]

    if (!student) {
      setTriggerError('A beneficiary is required to run the policy demo.')
      return
    }

    const cap = getStudentCap(student, capOverrides)
    const attemptedAmount = overLimitSchedule
      ? Number(schedule.amount)
      : cap + Math.max(1, Math.ceil(cap * 0.1))
    const eventId = `policy-test-${Date.now()}`
    const event = {
      _id: eventId,
      timestamp: new Date().toISOString(),
      eventType: 'POLICY_VIOLATION_SIMULATION',
      studentId: student.studentId,
      programmeId:
        programmes[0]?.programmeId || student.programmeId || 'DEMO-PROGRAMME',
      amount: attemptedAmount,
      policyDecision: 'REJECTED',
      rejectionReason: 'ERR_EXCEEDS_STUDENT_ALLOWANCE_CAP',
      txHash: null,
      ledgerResult: null,
    }

    setTriggerError('')
    setPolicyTestResult({
      studentId: student.studentId,
      scheduleId: schedule?.scheduleId || 'DEMO-OVER-LIMIT',
      amount: attemptedAmount,
      cap,
      reason: event.rejectionReason,
    })
    setTriggerLogs((current) => [event, ...current])
  }

  async function handleAgentTrigger() {
    if (killSwitchActive) return
    setIsTriggering(true)
    setTriggerError('')
    try {
      const result = await triggerAgent()
      const processed = Array.isArray(result.processed) ? result.processed : []
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
                ? 'EXECUTED'
                : outcome.status === 'REJECTED_BY_POLICY'
                  ? 'REJECTED'
                  : outcome.status,
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
          txHash: item.txHash || null,
          ledgerResult: item.txHash ? 'tesSUCCESS' : null,
        })),
        ...current,
      ])
    } catch (error) {
      setTriggerError(error.message)
    } finally {
      setIsTriggering(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        apiOnline={apiMode === 'LIVE'}
      />
      <div className="workspace">
        <div className="topbar">
          <div className="breadcrumb">
            <span>FundFlow</span>
            <span className="breadcrumb-slash">/</span>
            <strong>
              {activeView === 'admin' ? 'Admin dashboard' : 'Student portal'}
            </strong>
          </div>
          <div className="topbar-actions">
            <span
              className={`environment-pill ${connectionStatus.className}`}
              role="status"
              aria-live="polite"
              title="Connection mode reflects live API responses and mock fallbacks."
            >
              <span />
              {connectionStatus.label}
            </span>
            <IconButton type="button" aria-label="Notifications">
              <Bell size={17} />
              <span className="notification-dot" />
            </IconButton>
            <span className="topbar-avatar">AM</span>
          </div>
        </div>

        {activeView === 'admin' ? (
          <AdminDashboard
            programmes={programmes}
            beneficiaries={beneficiaries}
            schedules={schedules}
            auditLogs={visibleAuditLogs}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            isTriggering={isTriggering}
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
            lastUpdated={lastUpdated}
            onRefresh={() => refreshDashboard(true)}
            onTrigger={handleAgentTrigger}
            onTestPolicyBlock={handleSimulatePolicyViolation}
          />
        ) : (
          <StudentPortal
            beneficiaries={beneficiaries}
            isLoadingBeneficiaries={isLoading}
          />
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
