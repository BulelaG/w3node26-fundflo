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
  Info,
  Download,
  CreditCard,
  QrCode,
  FileText,
  Send,
  Coffee
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function StudentPortal({ beneficiaries = [] }) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    beneficiaries.length > 0 ? beneficiaries[0].studentId : 'STU-001'
  );
  const [studentData, setStudentData] = useState(null);
  const [liveLedgerBalance, setLiveLedgerBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimNotification, setClaimNotification] = useState(null);

  // Load student data when selectedStudentId changes
  useEffect(() => {
    let isMounted = true;
    async function loadStudent() {
      setIsLoading(true);
      try {
        const data = await api.getStudentStatus(selectedStudentId);
        if (isMounted) {
          setStudentData(data);
          if (data.walletAddress) {
            try {
              const liveInfo = await api.getXrplAccountInfo(data.walletAddress);
              if (isMounted) setLiveLedgerBalance(liveInfo);
            } catch (e) {
              console.log('Account not yet active on ledger');
            }
          }
        }
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

  // Student on-demand stipend claim
  const handleClaimStipend = async () => {
    setIsClaiming(true);
    setClaimNotification(null);
    try {
      const res = await api.claimStudentAllowance(selectedStudentId);
      if (res.success) {
        setClaimNotification({
          type: 'success',
          title: 'Stipend Disbursed & Verified!',
          message: `10 XRP settled on XRPL Testnet! Hash: ${res.decision.txHash ? res.decision.txHash.substring(0, 10) + '...' : ''}`
        });
      } else {
        setClaimNotification({
          type: 'error',
          title: 'Claim Intercepted by Policy',
          message: `Reason: ${res.decision.reasonCode || 'Policy requirement failed.'}`
        });
      }
      // Reload student data
      const updated = await api.getStudentStatus(selectedStudentId);
      setStudentData(updated);
      if (updated.walletAddress) {
        const liveInfo = await api.getXrplAccountInfo(updated.walletAddress);
        setLiveLedgerBalance(liveInfo);
      }
    } catch (err) {
      setClaimNotification({
        type: 'error',
        title: 'Claim Failed',
        message: err.message
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const latestDisbursement = studentData && studentData.disbursements && studentData.disbursements.length > 0
    ? studentData.disbursements[0]
    : null;

  const isVerified = latestDisbursement && latestDisbursement.status === 'VERIFIED';
  const isPending = latestDisbursement && latestDisbursement.status === 'PENDING';
  const isRejected = latestDisbursement && latestDisbursement.status === 'REJECTED';

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notification */}
      {claimNotification && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '12px',
          backgroundColor: claimNotification.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{claimNotification.title}</div>
            <div style={{ fontSize: '0.84rem' }}>{claimNotification.message}</div>
          </div>
          <button
            onClick={() => setClaimNotification(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Student Switcher & Profile Header */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '20px 24px' }}>
        <div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
            Verified Student Self-Service Portal
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <h2 className="font-display" style={{ fontSize: '1.45rem', fontWeight: '700', color: '#ffffff' }}>
              {studentData ? studentData.fullName : 'Loading...'}
            </h2>
            <StatusBadge status="ACTIVE" label="BURSARY ENROLLED" />
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>
            {studentData ? `${studentData.institution} • Student ID: ${studentData.studentId}` : ''}
          </p>
        </div>

        {/* Dropdown to switch student profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Select Beneficiary:</label>
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
              fontWeight: '600',
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
          ? 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.15) 0%, rgba(10, 10, 15, 0.98) 75%)'
          : 'radial-gradient(ellipse at top, rgba(0, 242, 254, 0.1) 0%, rgba(10, 10, 15, 0.98) 75%)',
        border: `1px solid ${isVerified ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 242, 254, 0.25)'}`,
        padding: '38px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Glow Icon */}
        <div style={{
          width: '74px',
          height: '74px',
          borderRadius: '50%',
          backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 242, 254, 0.15)',
          color: isVerified ? 'var(--accent-green)' : 'var(--accent-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isVerified ? '0 0 40px rgba(16, 185, 129, 0.4)' : '0 0 35px rgba(0, 242, 254, 0.3)',
          marginBottom: '4px'
        }}>
          {isVerified ? <CheckCircle2 size={42} /> : <Clock size={42} />}
        </div>

        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: isVerified ? 'var(--accent-green)' : 'var(--accent-cyan)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {isVerified ? 'Monthly Living Allowance Verified' : isPending ? 'Stipend Pending Autonomous Run' : 'Disbursement Evaluated'}
          </span>
          <div className="font-display" style={{ fontSize: '2.6rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em', marginTop: '6px' }}>
            {studentData ? `${studentData.monthlyAllowance} XRP` : '10 XRP'}
            <span style={{ fontSize: '1.2rem', fontWeight: '300', color: 'var(--text-dim)', marginLeft: '12px' }}>
              (~R1,650.00 ZAR)
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', maxWidth: '560px', margin: '8px auto 0 auto' }}>
            {isVerified
              ? 'Settled irreversibly on the XRP Ledger directly to your self-custody student wallet. No middlemen, no deductions.'
              : 'Your scheduled stipend is in the queue for autonomous evaluation by FundFlow.'}
          </p>
        </div>

        {/* Live Wallet & On-Chain Balance Strip */}
        {studentData && studentData.walletAddress && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '8px 16px',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderRadius: '9999px',
            border: '1px solid var(--border-color)',
            fontSize: '0.8rem'
          }}>
            <span style={{ color: 'var(--text-dim)' }}>Wallet:</span>
            <span className="mono" style={{ color: 'var(--accent-cyan)' }}>
              {studentData.walletAddress}
            </span>
            <button
              onClick={() => copyToClipboard(studentData.walletAddress)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
              title="Copy Address"
            >
              <Copy size={12} />
            </button>
            {liveLedgerBalance && liveLedgerBalance.balanceXRP !== undefined && (
              <span style={{ color: 'var(--accent-green)', fontWeight: '600', marginLeft: '6px' }}>
                • On-Chain Balance: {liveLedgerBalance.balanceXRP} XRP
              </span>
            )}
          </div>
        )}

        {/* Student Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={handleClaimStipend}
            disabled={isClaiming}
            className="btn btn-primary"
            style={{ padding: '9px 18px', fontSize: '0.84rem' }}
          >
            <Send size={14} />
            <span>{isClaiming ? 'Agent Evaluating Claim...' : 'Claim Monthly Stipend'}</span>
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            className="btn btn-outline"
            style={{ padding: '9px 18px', fontSize: '0.84rem' }}
          >
            <QrCode size={14} color="var(--accent-cyan)" />
            <span>Merchant Tap-to-Pay QR</span>
          </button>
        </div>

        {/* 3 Value Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          width: '100%',
          marginTop: '12px'
        }}>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Middleman Rent Extracted</div>
            <div className="font-display" style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--accent-green)', marginTop: '4px' }}>
              R0.00
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Zero predatory bank fees</div>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Settlement Finality</div>
            <div className="font-display" style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--accent-cyan)', marginTop: '4px' }}>
              ~3.8 Seconds
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>RPCA Ledger Consensus</div>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Ledger Network Fee</div>
            <div className="font-display" style={{ fontSize: '1.35rem', fontWeight: '700', color: '#ffffff', marginTop: '4px' }}>
              0.000012 XRP
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Less than R0.01 per payment</div>
          </div>
        </div>
      </div>

      {/* Cryptographic Proof Card */}
      {latestDisbursement && latestDisbursement.txHash && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--accent-green)" />
              <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff' }}>
                Cryptographic Proof of Payout
              </h3>
            </div>

            <button
              onClick={() => setShowReceiptModal(true)}
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <FileText size={14} color="var(--accent-cyan)" />
              <span>Residency Assurance Statement</span>
            </button>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
            Validated independently against the sponsor mandate and settled on the public XRP Ledger.
          </p>

          <div style={{
            backgroundColor: '#000000',
            padding: '14px 18px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>XRPL Transaction Hash</div>
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
                {copiedHash ? 'Copied!' : 'Copy'}
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
        <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', marginBottom: '14px' }}>
          Disbursement Schedule & History
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
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Pending evaluation</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Loading records...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Official Student Residency Assurance Statement */}
      {showReceiptModal && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={24} color="var(--accent-green)" />
                <h3 className="font-display" style={{ fontSize: '1.25rem', color: '#ffffff' }}>
                  Student Funding Assurance Certificate
                </h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Cryptographic payment confirmation for student accommodation & landlords
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1c1c28', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Beneficiary:</span>
                <span style={{ fontWeight: '600', color: '#fff' }}>{studentData?.fullName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1c1c28', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Student ID:</span>
                <span style={{ color: '#fff' }}>{studentData?.studentId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1c1c28', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Institution:</span>
                <span style={{ color: '#fff' }}>{studentData?.institution}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1c1c28', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Living Allowance:</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{studentData?.monthlyAllowance} XRP (~R1,650)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1c1c28', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Ledger Status:</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>VERIFIED (tesSUCCESS)</span>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Ledger Transaction Hash:</span>
                <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', wordBreak: 'break-all', marginTop: '4px' }}>
                  {latestDisbursement?.txHash}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => window.print()}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                <Download size={14} /> Print Statement
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Merchant Tap-to-Pay QR Code Simulation */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '420px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
              <Coffee size={22} color="var(--accent-cyan)" />
              <h3 className="font-display" style={{ fontSize: '1.25rem', color: '#ffffff' }}>
                Campus Merchant Tap-to-Pay
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '20px' }}>
              Scan at authorized campus bookstores, cafeterias, and transport terminals.
            </p>

            {/* Simulated QR Box */}
            <div style={{
              width: '200px',
              height: '200px',
              margin: '0 auto 20px auto',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(0, 242, 254, 0.3)'
            }}>
              <QrCode size={160} color="#000000" />
            </div>

            <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', wordBreak: 'break-all', marginBottom: '16px' }}>
              {studentData?.walletAddress}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Close QR Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
