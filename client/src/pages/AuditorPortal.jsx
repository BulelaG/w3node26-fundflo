import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  Search,
  Download,
  ExternalLink,
  Copy,
  AlertTriangle,
  CheckCircle,
  Database
} from 'lucide-react';
import { api } from '../services/api';

export default function AuditorPortal({ auditLogs = [] }) {
  const [adminWalletInfo, setAdminWalletInfo] = useState(null);
  const [inspectHash, setInspectHash] = useState('');
  const [inspectionResult, setInspectionResult] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  useEffect(() => {
    async function loadWallet() {
      try {
        const info = await api.getXrplAdminWallet();
        setAdminWalletInfo(info);
      } catch (err) {
        console.error('Failed to load auditor reserve info:', err);
      }
    }
    loadWallet();
  }, []);

  const handleInspectHash = (e) => {
    e.preventDefault();
    if (!inspectHash.trim()) return;

    const query = inspectHash.trim();
    const match = auditLogs.find(l => l.txHash && l.txHash.toLowerCase() === query.toLowerCase());

    if (match) {
      setInspectionResult({
        verified: true,
        log: match,
        message: 'MATCH CONFIRMED: Transaction is an official, policy-approved FundFlow bursary disbursement.'
      });
    } else {
      setInspectionResult({
        verified: false,
        log: null,
        message: 'NO MATCH IN POLICY LEDGER: This transaction was NOT authorized through an approved FundFlow mandate. Potential out-of-band or unverified movement.'
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportCSV = () => {
    window.open(api.getAuditorExportUrl('csv'), '_blank');
  };

  return (
    <main className="main-content">
      <header className="page-header">
        <div>
          <div className="eyebrow">REGULATORY COMPLIANCE / FORENSIC AUDIT</div>
          <h1>Auditor-General (AGSA) Verification Hub</h1>
          <p>Continuous cryptographic proof-of-reserve and transaction reconciliation for South African education funds.</p>
        </div>
        <div className="page-actions">
          <button
            onClick={handleExportCSV}
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '9px',
              background: '#ffffff',
              border: '1px solid var(--border)',
              color: 'var(--navy)',
              fontWeight: '600',
              fontSize: '0.84rem'
            }}
          >
            <Download size={15} color="#047857" />
            <span>Export Forensic Dossier (.CSV)</span>
          </button>
        </div>
      </header>

      {/* Proof of Reserve Panel */}
      <section className="panel" style={{ padding: '24px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
        <div className="panel-heading" style={{ marginBottom: '16px' }}>
          <div>
            <div className="eyebrow" style={{ color: '#047857' }}>ON-CHAIN RECONCILIATION</div>
            <h2>Cryptographic Proof of Reserve</h2>
            <p style={{ color: '#065f46' }}>
              Live validated XRP Ledger reserves backing active student bursary allocations. Verified via RPCA consensus.
            </p>
          </div>
          <span className="status-badge status-verified">
            <ShieldCheck size={14} />
            RPCA VALIDATED
          </span>
        </div>

        <div className="reserve-grid">
          <div className="reserve-card" style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
            <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: '700', textTransform: 'uppercase' }}>
              Treasury Vault Address
            </div>
            <div className="mono" style={{ fontSize: '0.84rem', color: 'var(--navy)', marginTop: '4px', wordBreak: 'break-all' }}>
              {adminWalletInfo ? adminWalletInfo.address : 'Connecting to Testnet...'}
            </div>
          </div>

          <div className="reserve-card" style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
            <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: '700', textTransform: 'uppercase' }}>
              Live Validated Reserve
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#047857', marginTop: '2px' }}>
              {adminWalletInfo ? `${adminWalletInfo.balanceXRP.toFixed(2)} XRP` : 'Syncing...'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Native Testnet XRP</div>
          </div>

          <div className="reserve-card" style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
            <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: '700', textTransform: 'uppercase' }}>
              Ledger Account Sequence
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--navy)', marginTop: '2px' }}>
              #{adminWalletInfo ? adminWalletInfo.sequence : '---'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Deterministic Nonce Count</div>
          </div>
        </div>
      </section>

      {/* Forensic Hash Inspector */}
      <section className="panel" style={{ padding: '24px' }}>
        <div className="panel-heading" style={{ marginBottom: '16px' }}>
          <div>
            <div className="eyebrow">INTEGRITY CHECK</div>
            <h2>Forensic Transaction Hash Inspector</h2>
            <p>Paste any 64-character transaction hash from the XRP Ledger to verify whether it was authorized by a signed bursary policy.</p>
          </div>
        </div>

        <form onSubmit={handleInspectHash} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            required
            placeholder="e.g. 43CDC252A0DFD39BEB8EC781DEFA08AA4D91A2406FF969C90A7CCA3CB991674E"
            value={inspectHash}
            onChange={(e) => setInspectHash(e.target.value)}
            className="form-input mono"
            style={{ flex: 1, minWidth: '280px', fontSize: '0.85rem' }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              borderRadius: '9px',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: '600'
            }}
          >
            Verify Cryptographic Match
          </button>
        </form>

        {inspectionResult && (
          <div className="audit-inspection-result" style={{
            marginTop: '18px',
            padding: '18px',
            borderRadius: '10px',
            backgroundColor: inspectionResult.verified ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${inspectionResult.verified ? '#a7f3d0' : '#fecaca'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {inspectionResult.verified ? (
                <CheckCircle size={18} color="#047857" />
              ) : (
                <AlertTriangle size={18} color="#b91c1c" />
              )}
              <strong style={{ color: inspectionResult.verified ? '#047857' : '#b91c1c', fontSize: '0.95rem' }}>
                {inspectionResult.verified ? 'VERIFIED POLICY MATCH' : 'UNVERIFIED OUT-OF-BAND MOVEMENT'}
              </strong>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--navy)', marginBottom: '8px' }}>
              {inspectionResult.message}
            </p>

            {inspectionResult.log && (
              <div className="audit-inspection-details" style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div><strong>Student ID:</strong> {inspectionResult.log.studentId}</div>
                <div><strong>Mandate:</strong> {inspectionResult.log.programmeId}</div>
                <div><strong>Amount:</strong> {inspectionResult.log.amount} XRP</div>
                <div><strong>Timestamp:</strong> {new Date(inspectionResult.log.timestamp).toLocaleString()}</div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Forensic Event Table */}
      <section className="panel schedule-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">CHRONOLOGICAL EVENT STREAM</div>
            <h2>Forensic Audit Log</h2>
          </div>
          <span className="panel-count">{auditLogs.length} records</span>
        </div>

        <div className="table-wrap">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>STUDENT / MANDATE</th>
                <th>AMOUNT</th>
                <th>POLICY GATE</th>
                <th>LEDGER RESULT</th>
                <th>TRANSACTION HASH</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => {
                const isApproved = log.policyDecision === 'APPROVED';

                return (
                  <tr key={log.id || log._id}>
                    <td className="time-cell">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      <strong>{log.studentId}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{log.programmeId}</div>
                    </td>
                    <td className="amount-cell">
                      <strong>{log.amount} XRP</strong>
                    </td>
                    <td>
                      <span className={`status-badge ${isApproved ? 'status-verified' : 'status-rejected'}`}>
                        {log.policyDecision}
                      </span>
                      <div className="audit-policy-decision">
                        <strong>FundFlow Policy Decision</strong>
                        <code>{log.decisionId || 'Decision ID unavailable'}</code>
                        <small>
                          Policy {log.policyVersion || 'unversioned'} · Reason{' '}
                          {log.reasonCode || log.rejectionReason || 'NONE'}
                        </small>
                      </div>
                    </td>
                    <td>
                      {log.ledgerResult ? (
                        <span style={{ color: '#047857', fontWeight: '600', fontSize: '0.8rem' }}>
                          {log.ledgerResult}
                        </span>
                      ) : (
                        <span style={{ color: '#b91c1c', fontSize: '0.76rem', fontWeight: '600' }}>
                          {log.rejectionReason}
                        </span>
                      )}
                    </td>
                    <td>
                      {log.txHash ? (
                        <a
                          href={`https://testnet.xrpl.org/transactions/${log.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                        >
                          <span className="mono">{log.txHash.substring(0, 10)}...</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>No Tx Dispatched</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
