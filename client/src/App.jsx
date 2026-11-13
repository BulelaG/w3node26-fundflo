import { useCallback, useEffect, useMemo, useState } from 'react'
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
  RefreshCw,
  ShieldCheck,
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
  getProgrammes,
  getSchedules,
  getStudentStatus,
  triggerAgent,
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

function StatusBadge({ status }) {
  const normalized = (status || 'UNKNOWN').toLowerCase().replaceAll('_', '-')
  const label = (status || 'Unknown').replaceAll('_', ' ')
  const icon =
    normalized.includes('reject') || normalized.includes('paused') ? (
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

function ProgrammeCard({ programme }) {
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
        <StatusBadge status={programme.isPaused ? 'PAUSED' : 'ACTIVE'} />
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

function AgentCard({ isRunning, triggerResult, onTrigger, error }) {
  return (
    <section className="agent-card">
      <div className="agent-card-glow" />
      <div className="agent-card-header">
        <span className="agent-icon">
          <Zap size={19} fill="currentColor" />
        </span>
        <span className="agent-label">AUTONOMOUS AGENT</span>
        <span className="agent-live">
          <span />
          READY
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

      {error && <div className="inline-error">{error}</div>}
      <button
        className="button button-agent"
        onClick={onTrigger}
        disabled={isRunning}
      >
        {isRunning ? (
          <>
            <LoaderCircle className="spin" size={17} />
            Running cycle…
          </>
        ) : (
          <>
            <Zap size={16} />
            Agent Trigger
            <ArrowRight size={16} />
          </>
        )}
      </button>
      <div className="agent-footnote">
        <ShieldCheck size={14} />
        Payments pass policy checks before settlement
      </div>
    </section>
  )
}

function ScheduleTable({ schedules, beneficiaries, currency }) {
  const beneficiaryById = useMemo(
    () => new Map(beneficiaries.map((student) => [student.studentId, student])),
    [beneficiaries],
  )

  return (
    <section className="panel schedule-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">DISBURSEMENT PIPELINE</div>
          <h2>Scheduled payments</h2>
        </div>
        <span className="panel-count">{schedules.length} records</span>
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
                      <StatusBadge status={schedule.status} />
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
        <span>Schedule data refreshes with the dashboard</span>
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
                      rel="noreferrer"
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
  dashboardError,
  lastUpdated,
  onRefresh,
  onTrigger,
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
          label="Pending schedules"
          value={pendingCount}
          detail="Awaiting agent evaluation"
          icon={Clock3}
          tone="amber"
        />
      </div>

      <div className="overview-grid">
        <ProgrammeCard programme={programme} />
        <AgentCard
          isRunning={isTriggering}
          triggerResult={triggerResult}
          onTrigger={onTrigger}
          error={triggerError}
        />
      </div>

      <div className="operations-grid">
        <ScheduleTable
          schedules={schedules}
          beneficiaries={beneficiaries}
          currency={currency}
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
  const [health, setHealth] = useState(null)
  const [programmes, setProgrammes] = useState([])
  const [beneficiaries, setBeneficiaries] = useState([])
  const [schedules, setSchedules] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [triggerLogs, setTriggerLogs] = useState([])
  const [triggerResult, setTriggerResult] = useState(null)
  const [triggerError, setTriggerError] = useState('')
  const [dashboardError, setDashboardError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isTriggering, setIsTriggering] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const applyDashboardResults = useCallback((results) => {
    const errors = []
    const setters = [
      [setHealth, 'health status'],
      [setProgrammes, 'programmes'],
      [setBeneficiaries, 'beneficiaries'],
      [setSchedules, 'schedules'],
      [setAuditLogs, 'audit logs'],
    ]

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        setters[index][0](result.value)
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

  async function handleAgentTrigger() {
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
        apiOnline={health?.status === 'ONLINE'}
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
            <span className={`environment-pill ${health?.status === 'ONLINE' ? 'is-online' : ''}`}>
              <span />
              {health?.status === 'ONLINE' ? 'API connected' : 'DEMO MODE'}
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
            dashboardError={dashboardError}
            lastUpdated={lastUpdated}
            onRefresh={() => refreshDashboard(true)}
            onTrigger={handleAgentTrigger}
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
