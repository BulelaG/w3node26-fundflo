import React from 'react';
import { ShieldCheck, Layers, UserCheck, RefreshCw, Radio } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onRefresh, isRefreshing }) {
  return (
    <header style={{
      backgroundColor: 'rgba(7, 13, 30, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '14px 0',
      marginBottom: '28px'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 0 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#070d1e',
            boxShadow: '0 0 16px rgba(0, 242, 254, 0.4)'
          }}>
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
                FundFlow
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: '700',
                backgroundColor: 'rgba(0, 242, 254, 0.15)',
                color: 'var(--accent-cyan)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(0, 242, 254, 0.3)'
              }}>
                XRPL TESTNET
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Every approved rand. Accounted for.
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setActiveTab('admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '7px',
              fontSize: '0.85rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'admin' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'admin' ? '#070d1e' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers size={16} />
            Administrator Control
          </button>

          <button
            onClick={() => setActiveTab('student')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '7px',
              fontSize: '0.85rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'student' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'student' ? '#070d1e' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <UserCheck size={16} />
            Student Assurance Portal
          </button>
        </div>

        {/* Network & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: 'var(--accent-green)',
            backgroundColor: 'var(--accent-green-bg)',
            padding: '5px 12px',
            borderRadius: '9999px',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Radio size={12} className="pulse" />
            <span>Consensus: Online</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-outline"
            style={{ padding: '7px 12px', fontSize: '0.8rem' }}
            title="Refresh Ledger and State"
          >
            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
}
