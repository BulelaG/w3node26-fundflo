import React, { useState } from 'react';
import {
  ShieldCheck,
  Layers,
  UserCheck,
  RefreshCw,
  Radio,
  Menu,
  X,
  TrendingUp,
  FileCheck2
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'admin', label: 'Admin Deck', icon: Layers },
    { id: 'analytics', label: 'Treasury & Savings', icon: TrendingUp },
    { id: 'auditor', label: 'Auditor-General Hub', icon: FileCheck2 },
    { id: 'student', label: 'Student Portal', icon: UserCheck }
  ];

  return (
    <header style={{
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 0',
      marginBottom: '24px'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 0 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000000',
            boxShadow: '0 0 20px rgba(5, 150, 105, 0.28)'
          }}>
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div> */}
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

        {/* Desktop View Switcher (All 4 Enterprise Tabs) */}
        <div className="mobile-hide" style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface-elevated)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          gap: '2px'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--accent-cyan)' : 'transparent',
                  color: isActive ? '#000000' : 'var(--text-dim)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
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
        </div>
      </div>

      {/* Mobile Tab Switcher Strip (Horizontal scrollable bar) */}
      <div style={{
        display: 'none',
        marginTop: '10px',
        padding: '0 12px',
        overflowX: 'auto'
      }} className="mobile-show-flex">
        <div style={{
          display: 'flex',
          width: '100%',
          backgroundColor: 'var(--bg-surface-elevated)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          gap: '4px',
          minWidth: '380px'
        }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: '7px',
                fontSize: '0.76rem',
                fontWeight: '600',
                border: 'none',
                backgroundColor: activeTab === item.id ? 'var(--accent-cyan)' : 'transparent',
                color: activeTab === item.id ? '#000000' : 'var(--text-dim)',
                whiteSpace: 'nowrap'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
