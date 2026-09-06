import React from 'react';
import { X, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { STATUS_COLORS } from '../utils/constants';

const STATUS_ICONS = {
  Verified: CheckCircle,
  Emerging: AlertTriangle,
  Flagged:  ShieldAlert,
};

function ScoreBar({ pct, color }) {
  return (
    <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.8s ease' }} />
    </div>
  );
}

export default function XAIModal({ alert, onClose }) {
  if (!alert) return null;

  const color            = STATUS_COLORS[alert.status] || '#8b949e';
  const mlConfidencePct  = Math.round((alert.ml_confidence  || 0) * 100);
  const weatherScorePct  = Math.round((alert.weather_score  || 0) * 100);
  const credibilityPct   = Math.round((alert.credibility_score || 0) * 100);
  const StatusIcon       = STATUS_ICONS[alert.status] || ShieldAlert;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480,
          maxHeight: '88vh',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '2px 7px',
                border: '1px solid var(--border)',
                borderRadius: 3,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'var(--bg-panel-alt)',
              }}>
                {alert.event_type}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {new Date(alert.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.45, fontStyle: 'italic' }}>
              "{alert.text}"
            </p>
            <div style={{ marginTop: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
              @{alert.username}
              <span style={{ margin: '0 5px', color: 'var(--text-muted)' }}>·</span>
              {(alert.followers || 0).toLocaleString()} followers
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 2, display: 'flex',
              transition: 'color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="panel-scroll" style={{ overflowY: 'auto', padding: '16px' }}>

          {/* Credibility score */}
          <div style={{
            background: 'var(--bg-panel-alt)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '14px 16px',
            marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <StatusIcon size={28} style={{ color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                Final Credibility Score
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {credibilityPct}%
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color }}>
                  {alert.status}
                </span>
              </div>
              <ScoreBar pct={credibilityPct} color={color} />
            </div>
          </div>

          {/* XAI breakdown */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Explainable AI Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>NLP Confidence</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{mlConfidencePct}%</span>
                </div>
                <ScoreBar pct={mlConfidencePct} color="#3b82f6" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Weather API Match</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{weatherScorePct}%</span>
                </div>
                <ScoreBar pct={weatherScorePct} color="#06b6d4" />
              </div>
            </div>
          </div>

          {/* Metadata grid */}
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 14,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}>
            {[
              { label: 'Media Attached',    value: alert.has_media ? 'Yes' : 'No' },
              { label: 'Cluster',           value: alert.cluster_id ? `Active #${alert.cluster_id}` : 'None' },
              { label: 'Source',            value: (alert.source || '').toUpperCase() },
              { label: 'Location Method',   value: alert.location_source === 'gps' ? 'Device GPS' : 'NER AI Model' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, fontWeight: 600 }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
