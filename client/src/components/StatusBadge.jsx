import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, PauseCircle } from 'lucide-react';

export default function StatusBadge({ status, label }) {
  const normalized = (status || '').toUpperCase();
  const text = label || status;

  let bg = 'rgba(120, 113, 108, 0.10)';
  let color = '#78716c';
  let Icon = Clock;

  if (normalized === 'VERIFIED' || normalized === 'APPROVED' || normalized === 'SUCCESS' || normalized === 'ACTIVE') {
    bg = 'rgba(5, 150, 105, 0.10)';
    color = '#059669';
    Icon = CheckCircle2;
  } else if (normalized === 'PENDING' || normalized === 'PROCESSING' || normalized === 'AWAITING') {
    bg = 'rgba(217, 119, 6, 0.10)';
    color = '#D97706';
    Icon = Clock;
  } else if (normalized === 'REJECTED' || normalized === 'BLOCKED' || normalized === 'FAILED') {
    bg = 'rgba(225, 29, 72, 0.10)';
    color = '#E11D48';
    Icon = XCircle;
  } else if (normalized === 'PAUSED') {
    bg = 'rgba(217, 119, 6, 0.10)';
    color = '#D97706';
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
