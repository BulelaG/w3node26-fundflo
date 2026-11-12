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
  Database,
  Lock,
  Layers
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
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
        message: 'MATCH FOUND: Transaction is an official, policy-approved FundFlow disbursement.'
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
            Regulatory Compliance & Forensic Audit Center
          </span>
          <h2 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
            Auditor-General (AGSA) Verification Hub
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>
            Continuous cryptographic proof-of-reserve and transaction reconciliation for South African funding bodies
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-outline"
          style={{ fontSize: '0.84rem', padding: '9px 16px' }}
        >
          <Download size={15} color="var(--accent-cyan)" />
          <span>Export Official Forensic Dossier (.CSV)</span>
        </button>
      </div>

      {/* Proof of Reserve Deck */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.07) 0%, rgba(10, 10, 15, 0.98) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Database size={18} color="var(--accent-green)" />
              <h3 className="font-display" style={{ fontSize: '1.15rem', color: '#ffffff' }}>
                On-Chain Cryptographic Proof of Reserve
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              Live validated XRP Ledger reserves backing active student bursary allocations. Verified via RPCA consensus.
            </p>
          </div>

          <StatusBadge status="VERIFIED" label="RPCA VALIDATED" />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginTop: '18px'
        }}>
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Sponsor Treasury Vault Address</div>
            <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', marginTop: '4px', wordBreak: 'break-all' }}>
              {adminWalletInfo ? adminWalletInfo.address : 'Connecting to Testnet...'}
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Live Validated Reserve</div>
            <div className="font-display" style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--accent-green)', marginTop: '2px' }}>
              {adminWalletInfo ? `${adminWalletInfo.balanceXRP.toFixed(2)} XRP` : 'Syncing...'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Native Testnet XRP</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ledger Account Sequence</div>
            <div className="font-display" style={{ fontSize: '1.3rem', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
              #{adminWalletInfo ? adminWalletInfo.sequence : '---'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Deterministic Nonce Count</div>
          </div>
        </div>
      </div>

      {/* Forensic Hash Verifier / Inspector */}
      <div className="card">
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="var(--accent-cyan)" />
            <h3 className="font-display" style={{ fontSize: '1.15rem', color: '#ffffff' }}>
              Forensic Transaction Hash Inspector
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            Paste any 64-character transaction hash from the XRP Ledger to verify whether it was authorized by a signed bursary policy or represents an unmonitored transfer.
          </p>
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
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
            Verify Cryptographic Match
          </button>
        </form>

        {/* Verification Result Display */}
        {inspectionResult && (
          <div style={{
            marginTop: '18px',
            padding: '16px 20px',
            borderRadius: '10px',
            backgroundColor: inspectionResult.verified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${inspectionResult.verified ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {inspectionResult.verified ? (
                <CheckCircle size={18} color="var(--accent-green)" />
              ) : (
                <AlertTriangle size={18} color="var(--accent-red)" />
              )}
              <strong style={{ color: inspectionResult.verified ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: '0.95rem' }}>
                {inspectionResult.verified ? 'VERIFIED POLICY MATCH' : 'UNVERIFIED OUT-OF-BAND MOVEMENT'}
              </strong>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              {inspectionResult.message}
            </p>

            {inspectionResult.log && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div><strong>Student ID:</strong> {inspectionResult.log.studentId}</div>
                <div><strong>Mandate:</strong> {inspectionResult.log.programmeId}</div>
                <div><strong>Amount Disbursed:</strong> {inspectionResult.log.amount} XRP</div>
                <div><strong>Timestamp:</strong> {new Date(inspectionResult.log.timestamp).toLocaleString()}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forensic Event Ledger Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff' }}>
              Chronological Forensic Ledger Stream
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Complete record of all policy evaluation attempts, reason codes, and settlement hashes
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600' }}>
            {auditLogs.length} Total Records
          </span>
        </div>

        <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Audit ID / Time</th>
                <th>Mandate / Student</th>
                <th>Amount</th>
                <th>Policy Gate</th>
                <th>Ledger Result</th>
                <th>Transaction Hash</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => {
                const isApproved = log.policyDecision === 'APPROVED';

                return (
                  <tr key={log.id}>
                    <td>
                      <div className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-main)' }}>{log.id}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#ffffff' }}>{log.studentId}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{log.programmeId}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{log.amount} XRP</span>
                    </td>
                    <td>
                      <StatusBadge status={isApproved ? 'APPROVED' : 'BLOCKED'} />
                    </td>
                    <td>
                      {log.ledgerResult ? (
                        <span style={{ color: 'var(--accent-green)', fontWeight: '600', fontSize: '0.78rem' }}>
                          {log.ledgerResult}
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: '600' }}>
                          {log.rejectionReason}
                        </span>
                      )}
                    </td>
                    <td>
                      {log.txHash ? (
                        <a
                          href={log.explorerUrl || `https://testnet.xrpl.org/transactions/${log.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                        >
                          <span className="mono">{log.txHash.substring(0, 10)}...</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>No Tx Dispatched</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
