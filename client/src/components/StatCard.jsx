import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, progress, accentColor = '#00f2fe' }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: `${accentColor}18`,
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          {value}
        </div>
        {subtext && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {subtext}
          </div>
        )}
      </div>

      {progress !== undefined && (
        <div style={{ marginTop: '14px', width: '100%', height: '6px', backgroundColor: 'rgba(36, 53, 102, 0.6)', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              height: '100%',
              backgroundColor: accentColor,
              borderRadius: '3px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      )}
    </div>
  );
}
