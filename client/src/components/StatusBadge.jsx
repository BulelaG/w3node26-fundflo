import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, PauseCircle } from 'lucide-react';

export default function StatusBadge({ status, label }) {
  const normalized = (status || '').toUpperCase();
  const text = label || status;

  let bg = 'rgba(148, 163, 184, 0.15)';
  let color = '#94a3b8';
  let Icon = Clock;

  if (normalized === 'VERIFIED' || normalized === 'APPROVED' || normalized === 'SUCCESS' || normalized === 'ACTIVE') {
    bg = 'rgba(16, 185, 129, 0.15)';
    color = '#10b981';
    Icon = CheckCircle2;
  } else if (normalized === 'PENDING' || normalized === 'PROCESSING' || normalized === 'AWAITING') {
    bg = 'rgba(245, 158, 11, 0.15)';
    color = '#f59e0b';
    Icon = Clock;
  } else if (normalized === 'REJECTED' || normalized === 'BLOCKED' || normalized === 'FAILED') {
    bg = 'rgba(239, 68, 68, 0.18)';
    color = '#ef4444';
    Icon = XCircle;
  } else if (normalized === 'PAUSED') {
    bg = 'rgba(148, 163, 184, 0.2)';
    color = '#cbd5e1';
    Icon = PauseCircle;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: bg,
        color: color,
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '700',
        letterSpacing: '0.04em',
        border: `1px solid ${color}40`,
        whiteSpace: 'nowrap'
      }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {text}
    </span>
  );
}
