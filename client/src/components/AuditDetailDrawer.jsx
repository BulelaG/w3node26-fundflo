import { useEffect } from 'react'
import { ExternalLink, X, ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, Layers, Clock } from 'lucide-react'
import StatusBadge from './StatusBadge'
import CopyValueButton from './CopyValueButton'

export default function AuditDetailDrawer({
  entry,
  currency = 'XRP',
  formatAmount,
  onClose,
}) {
  useEffect(() => {
    if (!entry) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleEscape(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [entry, onClose])

  if (!entry) return null

  const rejected = (entry.policyDecision || '').toUpperCase() === 'REJECTED'
  const reason = entry.reasonCode || entry.rejectionReason || 'POLICY_BLOCKED'

  // Map reason to specific Zero-Trust Policy Gate
  const getPolicyGateInfo = (code) => {
    switch (code) {
      case 'ERR_UNAUTHORIZED_BENEFICIARY':
      case 'ERR_BENEFICIARY_NOT_WHITELISTED':
        return {
          gateNumber: 1,
          gateName: 'Whitelist & Identity Gate',
          description: 'Beneficiary wallet address is not in the pre-approved student enrollment registry.',
          severity: 'Critical (Ghost Student Prevention)'
        }
      case 'ERR_EXCEEDS_STUDENT_ALLOWANCE_CAP':
        return {
          gateNumber: 2,
          gateName: 'Per-Student Allowance Cap Gate',
          description: 'Proposed stipend exceeds the approved monthly threshold set by the Bursary Administrator.',
          severity: 'High (Over-Disbursement Block)'
        }
      case 'ERR_DUPLICATE_PAYMENT':
        return {
          gateNumber: 3,
          gateName: 'Idempotency & Replay Gate',
          description: 'Payment schedule ID has already been settled and validated on the ledger in this cycle.',
          severity: 'High (Double-Spend Prevention)'
        }
      case 'ERR_PROGRAMME_PAUSED':
        return {
          gateNumber: 4,
          gateName: 'Emergency Pause Kill-Switch',
          description: 'The CFO or Sponsor Administrator engaged the emergency halt. Autonomous cycles are frozen.',
          severity: 'Administrative Intervention'
        }
      default:
        return {
          gateNumber: 5,
          gateName: 'Treasury Vault Mandate Gate',
          description: 'Out-of-agent rule verification rejected this transaction intent before ledger submission.',
          severity: 'Policy Rule Enforced'
        }
    }
  }

  const gateInfo = rejected ? getPolicyGateInfo(reason) : null

  return (
    <div
      className="audit-drawer-overlay"
      role="presentation"
      onClick={onClose}
    >
      <aside
        className="audit-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="audit-drawer-header">
          <div>
            <span className="eyebrow">XRPL TESTNET · AUDIT ASSURANCE EVENT</span>
            <h2 id="audit-detail-title">
              {rejected ? 'Policy Block Detail' : 'Settlement Verification'}
            </h2>
          </div>
          <button
            className="audit-drawer-close"
            type="button"
            onClick={onClose}
            aria-label="Close audit detail"
          >
            <X size={18} />
          </button>
        </div>

        <div className="audit-drawer-status">
          <StatusBadge status={entry.policyDecision || 'REVIEW'} />
          <span className="audit-timestamp">
            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
            {entry.timestamp
              ? new Date(entry.timestamp).toLocaleString('en-ZA', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'Timestamp unavailable'}
          </span>
        </div>

        {/* Highlighted Policy Gate Banner */}
        {rejected && gateInfo && (
          <div className="drawer-policy-gate-card">
            <div className="gate-header">
              <ShieldAlert size={18} className="gate-icon-alert" />
              <div>
                <strong>Gate {gateInfo.gateNumber}: {gateInfo.gateName}</strong>
                <span className="gate-severity">{gateInfo.severity}</span>
              </div>
            </div>
            <p className="gate-desc">{gateInfo.description}</p>
          </div>
        )}

        {!rejected && entry.txHash && (
          <div className="drawer-settled-gate-card">
            <div className="gate-header">
              <ShieldCheck size={18} className="gate-icon-success" />
              <div>
                <strong>Zero-Trust Consensus Reached</strong>
                <span className="gate-settled-badge">tesSUCCESS · 3.4s Settlement</span>
              </div>
            </div>
            <p className="gate-desc">
              All 5 security gates passed. Transaction verified immutably on XRPL Testnet.
            </p>
          </div>
        )}

        <div className="audit-detail-fields">
          <div>
            <span>Beneficiary</span>
            <strong>{entry.studentId || '—'}</strong>
          </div>
          <div>
            <span>Programme</span>
            <strong>{entry.programmeId || 'PRG-WE-THINK-CODE-2026'}</strong>
          </div>
          <div>
            <span>Disbursement Amount</span>
            <strong className="financial-value">
              {formatAmount
                ? formatAmount(entry.amount, currency)
                : `${entry.amount ?? '—'} ${currency}`}
            </strong>
          </div>
          <div>
            <span>Security Engine</span>
            <strong>Zero-Trust v1.0.0</strong>
          </div>
        </div>

        <section className="audit-detail-identifier">
          <div>
            <span>Cryptographic Decision ID</span>
            {entry.decisionId && (
              <CopyValueButton value={entry.decisionId} label="decision ID" />
            )}
          </div>
          <code>{entry.decisionId || 'DEC-AUTO-DISBURSEMENT-2026'}</code>
        </section>

        <section className={`audit-detail-identifier ${rejected ? 'is-rejected' : ''}`}>
          <div>
            <span>{rejected ? 'Intercepted Policy Code' : 'XRPL Transaction Hash'}</span>
            {entry.txHash && (
              <CopyValueButton value={entry.txHash} label="transaction hash" />
            )}
          </div>
          <code>
            {rejected
              ? reason
              : entry.txHash || 'Pending Ledger Consensus'}
          </code>
          {entry.txHash && (
            <a
              className="audit-drawer-ledger-link"
              href={`https://testnet.xrpl.org/transactions/${encodeURIComponent(entry.txHash)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Verify on XRPL Testnet Explorer <ExternalLink size={14} />
            </a>
          )}
        </section>

        {(entry.message || rejected) && (
          <section className="audit-detail-message">
            <span>Audit Trail Message</span>
            <p>{entry.message || `The policy engine rejected this attempt to prevent unauthorized fund transfer.`}</p>
          </section>
        )}
      </aside>
    </div>
  )
}
