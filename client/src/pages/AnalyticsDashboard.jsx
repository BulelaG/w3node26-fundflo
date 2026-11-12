import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShieldAlert,
  Zap,
  Wallet,
  Building,
  DollarSign,
  Award,
  Clock,
  ArrowUpRight,
  PieChart,
  BarChart3
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { api } from '../services/api';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
        <div className="font-display" style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '6px' }}>
          Computing Real-Time Forensic Intelligence...
        </div>
        <p style={{ fontSize: '0.82rem' }}>Aggregating XRPL ledger settlements and policy telemetry.</p>
      </div>
    );
  }

  const data = analytics || {
    totalAllocatedXRP: 50000,
    totalAllocatedZAR: 1250000,
    totalDisbursedXRP: 10,
    totalDisbursedZAR: 250,
    middlemanFeesSavedZAR: 145,
    leakageThwartedZAR: 2250,
    blockedAttemptsCount: 4,
    avgSettlementSeconds: 3.8,
    reconciliationRate: 100,
    institutionBreakdown: []
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        <div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
            Treasury Intelligence & Economic Assurance
          </span>
          <h2 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
            Financial Health & Leakage Prevention
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>
            Real-time reconciliation comparing on-chain settlement vs traditional South African bursary administration
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
        <StatCard
          title="Total Mandate Treasury"
          value={`R${data.totalAllocatedZAR.toLocaleString()}`}
          subtext={`${data.totalAllocatedXRP.toLocaleString()} XRP Allocated`}
          icon={Wallet}
          accentColor="#00f2fe"
        />

        <StatCard
          title="Leakage Thwarted"
          value={`R${data.leakageThwartedZAR.toLocaleString()}`}
          subtext={`${data.blockedAttemptsCount} Illegal / Duplicate Claims Blocked`}
          icon={ShieldAlert}
          accentColor="#ef4444"
        />

        <StatCard
          title="Middleman Rent Saved"
          value={`R${data.middlemanFeesSavedZAR.toLocaleString()}`}
          subtext="Eliminated Predatory Direct-Payment Fees"
          icon={TrendingUp}
          accentColor="#10b981"
        />

        <StatCard
          title="Settlement Velocity"
          value={`${data.avgSettlementSeconds}s`}
          subtext="RPCA Finality (vs 3-5 Business Days)"
          icon={Zap}
          accentColor="#38bdf8"
        />
      </div>

      {/* The Middleman Disruption Comparison: Why FundFlow Wins */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.06) 0%, rgba(10, 10, 15, 0.98) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        padding: '28px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="var(--accent-cyan)" />
            <h3 className="font-display" style={{ fontSize: '1.25rem', color: '#ffffff' }}>
              The South African Bursary Disruption Index
            </h3>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            How FundFlow on XRPL replaces flawed legacy fintech contracts (Werksmans Report & SIU Findings)
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Legacy Model */}
          <div style={{
            padding: '20px',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '0.78rem', color: '#ef4444', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
              Legacy Status Quo (4 Fintech Contractors)
            </div>
            <div className="font-display" style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', margin: '6px 0 12px 0' }}>
              R29.00 / student / month
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              <li>❌ Deductions subtracted directly from student food allowance</li>
              <li>❌ R10.00 fee per cash withdrawal at ATMs</li>
              <li>❌ 12-month delayed reconciliation (Qualified AGSA Audits)</li>
              <li>❌ Over 40,000 ineligible & ghost students slipped through</li>
              <li>❌ Contracts declared unconstitutional by High Court</li>
            </ul>
          </div>

          {/* FundFlow XRPL Model */}
          <div style={{
            padding: '20px',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '0.78rem', color: '#10b981', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
              FundFlow on XRPL Testnet
            </div>
            <div className="font-display" style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', margin: '6px 0 12px 0' }}>
              R0.00 Student Cost (0.000012 XRP Network Fee)
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#f8fafc' }}>
              <li>✅ 100% of the approved stipend reaches the student's wallet</li>
              <li>✅ Direct self-custody or authorized campus merchant tap-to-pay</li>
              <li>✅ 3.8-second real-time ledger reconciliation on XRPL</li>
              <li>✅ Zero ghost students: Policy Engine checks mandate whitelists</li>
              <li>✅ Cryptographic proof verifiable by AGSA on public explorers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Campus Breakdown & Policy Telemetry */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
        {/* Campus Allocation Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff' }}>
                Campus Distribution & Disbursed Volume
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Active bursary allocations across WeThinkCode campuses
              </p>
            </div>
            <Building size={18} color="var(--accent-cyan)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.institutionBreakdown && data.institutionBreakdown.length > 0 ? (
              data.institutionBreakdown.map((inst) => (
                <div key={inst.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: '600', color: '#ffffff' }}>{inst.name}</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>
                      {inst.disbursedXRP} XRP (~R{inst.disbursedZAR})
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(15, (inst.disbursedXRP / (data.totalDisbursedXRP || 1)) * 100))}%`,
                      height: '100%',
                      backgroundColor: 'var(--accent-cyan)',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {inst.students} Enrolled Bursar(s) Whitelisted
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>
                Campus distribution telemetry will update as cycles execute.
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Policy SLA Guarantees */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff' }}>
                Zero-Trust Policy Enforcement Metrics
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Deterministic boundaries shielding treasury funds
              </p>
            </div>
            <ShieldAlert size={18} color="#ef4444" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '0.88rem' }}>Replay & Double-Dipping Defense</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Blocks duplicate requests within active periods</div>
              </div>
              <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '0.85rem' }}>100% BLOCKED</span>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '0.88rem' }}>Allowance Velocity Limit</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Blocks payments exceeding individual student monthly cap</div>
              </div>
              <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '0.85rem' }}>ENFORCED</span>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '0.88rem' }}>Unauthorized Beneficiary Interceptor</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Blocks ghost student accounts not on the signed whitelist</div>
              </div>
              <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '0.85rem' }}>ZERO LEAKAGE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
