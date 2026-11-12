import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import StudentPortal from './pages/StudentPortal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('admin');
  const [programme, setProgramme] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSummary, setAuditSummary] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadAllData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [progs, bens, scheds, logs, summary] = await Promise.all([
        api.getProgrammes().catch(() => []),
        api.getBeneficiaries().catch(() => []),
        api.getSchedules().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getAuditSummary().catch(() => ({}))
      ]);

      if (progs && progs.length > 0) {
        setProgramme(progs[0]);
      }
      setBeneficiaries(bens || []);
      setSchedules(scheds || []);
      setAuditLogs(logs || []);
      setAuditSummary(summary || {});
      setError(null);
    } catch (err) {
      console.error('Failed to load application state:', err);
      setError('Unable to connect to FundFlow backend. Please verify server is running on http://localhost:5000');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    // Poll every 5 seconds to keep audit trail fresh
    const interval = setInterval(() => {
      loadAllData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => loadAllData(false)}
        isRefreshing={isRefreshing}
      />

      <main className="container" style={{ flex: 1 }}>
        {error && (
          <div style={{
            padding: '16px 20px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '10px',
            color: '#fca5a5',
            marginBottom: '24px',
            fontSize: '0.88rem'
          }}>
            <strong>Connection Notice:</strong> {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '8px', color: '#ffffff' }}>
              Initializing FundFlow Assurance Engine...
            </div>
            <p style={{ fontSize: '0.85rem' }}>Syncing with XRP Ledger consensus and policy store.</p>
          </div>
        ) : activeTab === 'admin' ? (
          <AdminDashboard
            programme={programme}
            beneficiaries={beneficiaries}
            schedules={schedules}
            auditLogs={auditLogs}
            auditSummary={auditSummary}
            onActionSuccess={() => loadAllData(true)}
          />
        ) : (
          <StudentPortal
            beneficiaries={beneficiaries}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '24px 0',
        marginTop: '60px',
        backgroundColor: 'rgba(7, 13, 30, 0.7)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 0 }}>
          <div>
            <strong>FundFlow</strong> — AI-Powered Student Funding Disbursement & Assurance Platform
          </div>
          <div>
            Built for W3Node Hackathon 2026 • Agentic Finance Track (Sponsored by Ripple)
          </div>
        </div>
      </footer>
    </div>
  );
}
