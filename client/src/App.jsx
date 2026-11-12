import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import StudentPortal from './pages/StudentPortal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('admin');
  const [programmes, setProgrammes] = useState([]);
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
        setProgrammes(progs);
        // keep current selection if valid, else pick first
        setProgramme(prev => {
          if (prev) {
            const found = progs.find(p => p.id === prev.id);
            if (found) return found;
          }
          return progs[0];
        });
      }
      setBeneficiaries(bens || []);
      setSchedules(scheds || []);
      setAuditLogs(logs || []);
      setAuditSummary(summary || {});
      setError(null);
    } catch (err) {
      console.error('Failed to load application state:', err);
      setError('Unable to connect to FundFlow backend on http://localhost:5000');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      loadAllData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  const handleSelectProgramme = (id) => {
    const selected = programmes.find(p => p.id === id);
    if (selected) {
      setProgramme(selected);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000000' }}>
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
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            color: '#fca5a5',
            marginBottom: '24px',
            fontSize: '0.88rem'
          }}>
            <strong>Connection Notice:</strong> {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-dim)' }}>
            <div className="font-display" style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '8px', color: '#ffffff' }}>
              Initializing FundFlow Enterprise Assurance Engine...
            </div>
            <p style={{ fontSize: '0.85rem' }}>Synchronizing policy mandates and XRP Ledger state.</p>
          </div>
        ) : activeTab === 'admin' ? (
          <AdminDashboard
            programme={programme}
            programmes={programmes}
            onSelectProgramme={handleSelectProgramme}
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

      {/* Production Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '28px 0',
        marginTop: '60px',
        backgroundColor: '#040406',
        fontSize: '0.8rem',
        color: 'var(--text-dim)'
      }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingBottom: 0 }}>
          <div>
            <strong className="font-display" style={{ color: '#ffffff' }}>FundFlow</strong> — AI-Powered Student Funding Disbursement & Assurance Platform
          </div>
          <div>
            Engineered for W3Node 2026 • Agentic Finance Track (Sponsored by Ripple)
          </div>
        </div>
      </footer>
    </div>
  );
}
