import React, { useState } from 'react'
import { Waves, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react'

// Preconfigured workspace accounts used by the local sign-in flow.
const DEMO_ACCOUNTS = [
  {
    id: 'cfo-1',
    role: 'cfo',
    roleLabel: 'CFO / Bursary Admin',
    name: 'Nombulelo Dlamini',
    email: 'nombulelo@fundflow.co.za',
    institution: 'WeThinkCode_',
    initials: 'ND',
    pin: '1234',
    landingView: 'admin',
  },
  {
    id: 'student-1',
    role: 'student',
    roleLabel: 'Student Beneficiary',
    name: 'Sipho Dlamini',
    studentId: 'STU-001',
    email: 'sipho.d@students.wtc.ac.za',
    institution: 'WeThinkCode_',
    initials: 'SD',
    pin: '5678',
    landingView: 'student',
  },
  {
    id: 'auditor-1',
    role: 'auditor',
    roleLabel: 'Auditor Inspector',
    name: 'Thabo Mokoena',
    email: 'tmokoena@agsa.gov.za',
    institution: 'Auditor-General South Africa',
    initials: 'TM',
    pin: '9012',
    landingView: 'auditor',
  },
]

const ROLE_META = {
  cfo: {
    color: '#111315',
    bg: '#f5f5f4',
    border: '#e7e5e4',
    icon: '🏛️',
    description: 'Manage mandates, approve wallets, monitor disbursements, and control the agent kill-switch.',
  },
  student: {
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    icon: '🎓',
    description: 'View your bursary balance, assurance certificate, and payment history.',
  },
  auditor: {
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: '🔍',
    description: 'Inspect immutable ledger proofs, verify transaction hashes, and export audit trails.',
  },
}

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [selectedRole, setSelectedRole] = useState('cfo')
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState(DEMO_ACCOUNTS[0].pin)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Signup state
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupInstitution, setSignupInstitution] = useState('')
  const [signupPin, setSignupPin] = useState('')
  const [signupPinConfirm, setSignupPinConfirm] = useState('')

  const selectedAccount =
    DEMO_ACCOUNTS.find((account) => account.role === selectedRole) ||
    DEMO_ACCOUNTS[0]
  const roleMeta = ROLE_META[selectedRole]

  function handleRoleSelect(role) {
    const account = DEMO_ACCOUNTS.find((item) => item.role === role)
    setSelectedRole(role)
    setPin(account?.pin || '')
    setError('')
  }

  function handleLogin(e) {
    e.preventDefault()
    setError('')

    if (!pin.trim()) {
      setError('Please enter your PIN to continue.')
      return
    }
    if (pin !== selectedAccount.pin) {
      setError('Incorrect PIN. Please check your credentials.')
      return
    }

    onLogin({ ...selectedAccount })
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')

    if (!signupName.trim()) { setError('Full name is required.'); return }
    if (!signupEmail.includes('@')) { setError('Enter a valid email address.'); return }
    if (!signupPin || signupPin.length < 4) { setError('PIN must be at least 4 digits.'); return }
    if (signupPin !== signupPinConfirm) { setError('PINs do not match.'); return }

    setIsLoading(true)
    await new Promise(r => setTimeout(r, 700))
    setIsLoading(false)

    // Create a session from signup data
    const newAccount = {
      id: `custom-${Date.now()}`,
      role: selectedRole,
      roleLabel:
        DEMO_ACCOUNTS.find((account) => account.role === selectedRole)?.roleLabel ||
        'CFO / Bursary Admin',
      name: signupName.trim(),
      email: signupEmail.trim(),
      institution: signupInstitution.trim() || 'FundFlow',
      initials: signupName.trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase(),
      landingView: DEMO_ACCOUNTS.find(a => a.role === selectedRole)?.landingView || 'admin',
    }
    onLogin(newAccount)
  }

  return (
    <div className="auth-screen">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-brand-mark">
            <img src="/fundflow-logo.png" alt="FundFlow Logo" className="brand-logo-img" />
          </span>
          <span className="auth-brand-copy">
            <strong>FundFlow</strong>
            <span>Every approved rand. Accounted for.</span>
          </span>
        </div>

        <div className="auth-hero">
          <div className="auth-hero-badge">
            <ShieldCheck size={14} />
            XRPL Testnet · Zero-Trust Policy Engine
          </div>
          <h1>Policy-gated student funding with verifiable assurance</h1>
          <p>
            Autonomous disbursements gated by an independent policy engine.
            Every payment is immutably recorded on the XRP Ledger — provable,
            auditable, and settled in seconds.
          </p>
          <div className="auth-features">
            {[
              ['🏦', 'Autonomous agent disburses on-schedule'],
              ['🛡️', 'Policy engine blocks fraud before the ledger'],
              ['📋', 'Audit-ready policy logs paired with validated XRPL proofs'],
              ['⚡', '3-second settlement vs. 2-day EFT'],
            ].map(([icon, text]) => (
              <div key={text} className="auth-feature-item">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div className="auth-hackathon-badge">
            <span>🏆</span>
            <span>
              <strong>W3Node Hackathon 2026</strong>
              <small>Agentic Finance Track · Powered by Ripple &amp; XRPL</small>
            </span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-mobile-brand-mark">
              <img src="/fundflow-logo.png" alt="FundFlow Logo" className="brand-logo-img" />
            </span>
            <div className="auth-mobile-brand-copy">
              <strong>FundFlow</strong>
              <span>Every approved rand. Accounted for.</span>
            </div>
          </div>
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              type="button"
              onClick={() => { setMode('login'); setError('') }}
            >
              Sign in
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              type="button"
              onClick={() => { setMode('signup'); setError('') }}
            >
              Create account
            </button>
          </div>

          {/* Role selector — shared between login and signup */}
          <div className="auth-role-selector">
            <label className="auth-field-label">Select your role</label>
            <div className="auth-role-grid">
              {Object.entries(ROLE_META).map(([role, meta]) => (
                <button
                  key={role}
                  type="button"
                  className={`auth-role-btn ${selectedRole === role ? 'active' : ''}`}
                  style={selectedRole === role ? {
                    borderColor: meta.border,
                    background: meta.bg,
                    color: meta.color,
                  } : {}}
                  onClick={() => handleRoleSelect(role)}
                >
                  <span className="auth-role-icon">{meta.icon}</span>
                  <span className="auth-role-label">
                    {DEMO_ACCOUNTS.find(a => a.role === role)?.roleLabel}
                  </span>
                </button>
              ))}
            </div>
            <p className="auth-role-description">{roleMeta.description}</p>
          </div>

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="pin-input">
                  Access PIN
                </label>
                <div className="auth-pin-wrap">
                  <input
                    id="pin-input"
                    className="form-input"
                    type={showPin ? 'text' : 'password'}
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={e => { setPin(e.target.value); setError('') }}
                    maxLength={8}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-pin-toggle"
                    onClick={() => setShowPin(v => !v)}
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="auth-error">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoading}
                style={{ background: roleMeta.color }}
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>

              <p className="auth-disclaimer">
                No real funds are involved. All transactions run on XRPL Testnet.
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignup}>
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="signup-name">Full name</label>
                <input
                  id="signup-name"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Thabo Molefe"
                  value={signupName}
                  onChange={e => { setSignupName(e.target.value); setError('') }}
                  autoComplete="name"
                />
              </div>
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="signup-email">Email address</label>
                <input
                  id="signup-email"
                  className="form-input"
                  type="email"
                  placeholder="you@institution.ac.za"
                  value={signupEmail}
                  onChange={e => { setSignupEmail(e.target.value); setError('') }}
                  autoComplete="email"
                />
              </div>
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="signup-institution">Institution (optional)</label>
                <input
                  id="signup-institution"
                  className="form-input"
                  type="text"
                  placeholder="e.g. WeThinkCode_"
                  value={signupInstitution}
                  onChange={e => { setSignupInstitution(e.target.value) }}
                />
              </div>
              <div className="auth-two-col">
                <div className="auth-field">
                  <label className="auth-field-label" htmlFor="signup-pin">PIN</label>
                  <input
                    id="signup-pin"
                    className="form-input"
                    type="password"
                    placeholder="4+ digits"
                    value={signupPin}
                    onChange={e => { setSignupPin(e.target.value); setError('') }}
                    maxLength={8}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-field-label" htmlFor="signup-pin2">Confirm PIN</label>
                  <input
                    id="signup-pin2"
                    className="form-input"
                    type="password"
                    placeholder="Repeat PIN"
                    value={signupPinConfirm}
                    onChange={e => { setSignupPinConfirm(e.target.value); setError('') }}
                    maxLength={8}
                  />
                </div>
              </div>

              {error && (
                <div className="auth-error">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoading}
                style={{ background: roleMeta.color }}
              >
                {isLoading ? 'Creating account…' : 'Create account & enter'}
              </button>

              <p className="auth-disclaimer">
                No real credentials are stored.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
