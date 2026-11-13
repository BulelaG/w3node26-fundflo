import { useEffect } from 'react'
import { ExternalLink, X } from 'lucide-react'
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
            <span className="eyebrow">XRPL TESTNET / AUDIT EVENT</span>
            <h2 id="audit-detail-title">Audit detail</h2>
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
          <span>
            {entry.timestamp
              ? new Date(entry.timestamp).toLocaleString('en-ZA', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'Timestamp unavailable'}
          </span>
        </div>

        <div className="audit-detail-fields">
          <div>
            <span>Beneficiary</span>
            <strong>{entry.studentId || '—'}</strong>
          </div>
          <div>
            <span>Programme</span>
            <strong>{entry.programmeId || '—'}</strong>
          </div>
          <div>
            <span>Amount</span>
            <strong className="financial-value">
              {formatAmount
                ? formatAmount(entry.amount, currency)
                : `${entry.amount ?? '—'} ${currency}`}
            </strong>
          </div>
          <div>
            <span>Policy version</span>
            <strong>{entry.policyVersion || 'Unversioned'}</strong>
          </div>
        </div>

        <section className="audit-detail-identifier">
          <div>
            <span>FundFlow decision ID</span>
            {entry.decisionId && (
              <CopyValueButton value={entry.decisionId} label="decision ID" />
            )}
          </div>
          <code>{entry.decisionId || 'Decision ID unavailable'}</code>
        </section>

        <section className={`audit-detail-identifier ${rejected ? 'is-rejected' : ''}`}>
          <div>
            <span>{rejected ? 'Policy rule' : 'XRPL transaction hash'}</span>
            {entry.txHash && (
              <CopyValueButton value={entry.txHash} label="transaction hash" />
            )}
          </div>
          <code>
            {rejected
              ? entry.reasonCode || entry.rejectionReason || 'POLICY_BLOCKED'
              : entry.txHash || entry.reasonCode || 'No ledger transaction'}
          </code>
          {entry.txHash && (
            <a
              className="audit-drawer-ledger-link"
              href={`https://testnet.xrpl.org/transactions/${encodeURIComponent(entry.txHash)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in XRPL Testnet Explorer <ExternalLink size={14} />
            </a>
          )}
        </section>

        {entry.message && (
          <section className="audit-detail-message">
            <span>Decision message</span>
            <p>{entry.message}</p>
          </section>
        )}
      </aside>
    </div>
  )
}
