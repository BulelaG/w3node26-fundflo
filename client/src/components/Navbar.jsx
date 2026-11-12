import React, { useState } from 'react';
import { ShieldCheck, Layers, UserCheck, RefreshCw, Radio, Menu, X, PlusCircle } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  onOpenNewProgrammeModal,
  onOpenNewBeneficiaryModal
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header style={{
      backgroundColor: 'rgba(0, 0, 0, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '14px 0',
      marginBottom: '24px'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 0 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000000',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.45)'
          }}>
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '1.35rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#ffffff' }}>
                FundFlow
              </span>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: '700',
                backgroundColor: 'rgba(0, 242, 254, 0.12)',
                color: 'var(--accent-cyan)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(0, 242, 254, 0.3)'
              }}>
                XRPL TESTNET
              </span>
            </div>
            <div className="font-display mobile-hide" style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: '300' }}>
              Every approved rand. Accounted for.
            </div>
          </div>
        </div>

        {/* Desktop View Switcher */}
        <div className="mobile-hide" style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface-elevated)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setActiveTab('admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'admin' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'admin' ? '#000000' : 'var(--text-dim)',
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
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'student' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'student' ? '#000000' : 'var(--text-dim)',
              transition: 'all 0.2s ease'
            }}
          >
            <UserCheck size={16} />
            Student Assurance
          </button>
        </div>

        {/* Actions & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="mobile-hide" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: 'var(--accent-green)',
            backgroundColor: 'var(--accent-green-bg)',
            padding: '5px 12px',
            borderRadius: '9999px',
            border: '1px solid var(--accent-green-border)'
          }}>
            <Radio size={12} />
            <span>Consensus: Online</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-outline"
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            title="Sync with XRP Ledger"
          >
            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span className="mobile-hide">Sync</span>
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-outline"
            style={{ display: 'none', padding: '8px' }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher Strip */}
      <div style={{
        display: 'none',
        marginTop: '12px',
        padding: '0 14px'
      }} className="mobile-show-flex">
        <div style={{
          display: 'flex',
          width: '100%',
          backgroundColor: 'var(--bg-surface-elevated)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setActiveTab('admin')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '7px',
              fontSize: '0.82rem',
              fontWeight: '600',
              border: 'none',
              backgroundColor: activeTab === 'admin' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'admin' ? '#000000' : 'var(--text-dim)'
            }}
          >
            Admin View
          </button>
          <button
            onClick={() => setActiveTab('student')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '7px',
              fontSize: '0.82rem',
              fontWeight: '600',
              border: 'none',
              backgroundColor: activeTab === 'student' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'student' ? '#000000' : 'var(--text-dim)'
            }}
          >
            Student View
          </button>
        </div>
      </div>
    </header>
  );
}
