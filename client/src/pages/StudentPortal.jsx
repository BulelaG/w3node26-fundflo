import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Copy,
  Clock,
  AlertTriangle,
  Award,
  Zap,
  Info
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function StudentPortal({ beneficiaries = [] }) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    beneficiaries.length > 0 ? beneficiaries[0].studentId : 'STU-001'
  );
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);

  // Load student data when selectedStudentId changes
  useEffect(() => {
    let isMounted = true;
    async function loadStudent() {
      setIsLoading(true);
      try {
        const data = await api.getStudentStatus(selectedStudentId);
        if (isMounted) setStudentData(data);
      } catch (err) {
        console.error('Failed to load student status:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (selectedStudentId) {
      loadStudent();
    }

    return () => { isMounted = false; };
  }, [selectedStudentId]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const latestDisbursement = studentData && studentData.disbursements && studentData.disbursements.length > 0
    ? studentData.disbursements[0]
    : null;

  const isVerified = latestDisbursement && latestDisbursement.status === 'VERIFIED';
  const isPending = latestDisbursement && latestDisbursement.status === 'PENDING';
  const isRejected = latestDisbursement && latestDisbursement.status === 'REJECTED';

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Student Switcher & Profile Header */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Viewing Student Beneficiary Portal
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>
              {studentData ? studentData.fullName : 'Loading...'}
            </h2>
            <StatusBadge status="ACTIVE" label="BURSARY RECIPIENT" />
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {studentData ? `${studentData.institution} • Student ID: ${studentData.studentId}` : ''}
          </p>
        </div>

        {/* Dropdown to switch student profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Switch Student:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.86rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {beneficiaries.map((b) => (
              <option key={b.studentId} value={b.studentId}>
                {b.fullName} ({b.studentId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Assurance Card */}
      <div className="card" style={{
        background: isVerified
          ? 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.15) 0%, rgba(15, 27, 56, 0.95) 70%)'
          : 'radial-gradient(ellipse at top, rgba(0, 242, 254, 0.1) 0%, rgba(15, 27, 56, 0.95) 70%)',
        border: `1px solid ${isVerified ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 242, 254, 0.25)'}`,
        padding: '36px 28px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Glow Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 242, 254, 0.15)',
          color: isVerified ? 'var(--accent-green)' : 'var(--accent-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isVerified ? '0 0 35px rgba(16, 185, 129, 0.4)' : '0 0 30px rgba(0, 242, 254, 0.3)',
          marginBottom: '6px'
        }}>
          {isVerified ? <CheckCircle2 size={40} /> : <Clock size={40} />}
        </div>

        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: isVerified ? 'var(--accent-green)' : 'var(--accent-cyan)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {isVerified ? 'Monthly Living Allowance Verified' : isPending ? 'Disbursement Awaiting Autonomous Agent Cycle' : 'Disbursement Evaluated'}
          </span>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.03em', marginTop: '4px' }}>
            {studentData ? `${studentData.monthlyAllowance} XRP` : '10 XRP'}
            <span style={{ fontSize: '1.2rem', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '10px' }}>
              (~R1,650.00 ZAR)
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '540px', margin: '8px auto 0 auto' }}>
            {isVerified
              ? 'Settled irreversibly on the XRP Ledger directly to your self-custody student wallet. No middlemen, no delayed checks.'
              : 'Your scheduled stipend is in the queue for autonomous evaluation by FundFlow.'}
          </p>
        </div>

        {/* Transparent Benefit Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          width: '100%',
          marginTop: '12px'
        }}>
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Middleman Rent Extracted</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-green)', marginTop: '2px' }}>
              R0.00
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Zero bank charges or deduction fees</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Settlement Finality</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-cyan)', marginTop: '2px' }}>
              ~3.8 Seconds
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RPCA Ledger Consensus</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>XRPL Network Fee</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', marginTop: '2px' }}>
              0.000012 XRP
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Less than R0.01 per payment</div>
          </div>
        </div>
      </div>

      {/* Cryptographic Proof & Ledger Explorer Card */}
      {latestDisbursement && latestDisbursement.txHash && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <ShieldCheck size={20} color="var(--accent-green)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff' }}>
              Cryptographic Proof of Payout
            </h3>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Don't take anyone's word for it. Your funding was validated against the approved sponsor mandate and settled on the public XRP Ledger.
          </p>

          <div style={{
            backgroundColor: 'var(--bg-primary)',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>XRPL Transaction Hash</div>
              <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                {latestDisbursement.txHash}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => copyToClipboard(latestDisbursement.txHash)}
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <Copy size={13} />
                {copiedHash ? 'Copied!' : 'Copy Hash'}
              </button>

              <a
                href={latestDisbursement.xrplExplorerUrl || `https://testnet.xrpl.org/transactions/${latestDisbursement.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              >
                <span>Verify on XRPL Explorer</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Historical Disbursements Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff', marginBottom: '14px' }}>
          Disbursement Schedule & Assurance History
        </h3>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Transaction Reference</th>
              </tr>
            </thead>
            <tbody>
              {studentData && studentData.disbursements ? (
                studentData.disbursements.map((d) => (
                  <tr key={d.scheduleId}>
                    <td style={{ fontWeight: '600', color: '#ffffff' }}>
                      {d.period || 'November 2026'}
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{d.amount} XRP</span>
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td>
                      {d.txHash ? (
                        <a
                          href={d.xrplExplorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                        >
                          <span className="mono">{d.txHash.substring(0, 10)}...</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : d.rejectionReason ? (
                        <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{d.rejectionReason}</span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pending evaluation</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
