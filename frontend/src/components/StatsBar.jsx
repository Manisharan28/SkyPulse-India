import React from 'react';

const STATUS = [
  { key: 'total',    label: 'Total Alerts', color: '#8b949e' },
  { key: 'verified', label: 'Verified',     color: '#22c55e' },
  { key: 'emerging', label: 'Emerging',     color: '#f59e0b' },
  { key: 'flagged',  label: 'Flagged',      color: '#ef4444' },
];

export default function StatsBar({ stats }) {
  return (
    <header style={{
      height: 52,
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'relative',
      zIndex: 20,
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.3px',
        }}>
          SkyPulse India
        </span>
        <span style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          Weather Intelligence
        </span>

        {/* Live dot */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
          <span style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'inline-block',
            animation: 'pulse-ring 2s ease infinite',
          }} />
          <span style={{ fontSize: 11, color: 'var(--accent-light)', fontWeight: 500 }}>
            LIVE
          </span>
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STATUS.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{
                width: 1, height: 28,
                background: 'var(--border)',
                margin: '0 16px',
              }} />
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 1,
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: s.color,
                lineHeight: 1,
              }}>
                {stats?.[s.key] ?? 0}
              </div>
            </div>
          </div>
        ))}
      </div>
    </header>
  );
}
