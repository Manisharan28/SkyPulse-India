import React from 'react';
import { Clock, ExternalLink, MapPin, Users } from 'lucide-react';
import { STATUS_COLORS } from '../utils/constants';

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function RecentTweets({ alerts, onAlertClick }) {
  // Take the 30 most recent alerts (already sorted by created_at desc from backend)
  const recent = (alerts || []).slice(0, 30);

  return (
    <div style={{
      width: 260,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border)',
      position: 'relative',
      zIndex: 10,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
      }}>
        <Clock size={12} style={{ color: 'var(--accent-light)' }} />
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--text-muted)',
        }}>
          Recent Alerts
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)',
          background: 'var(--bg-panel-alt)', border: '1px solid var(--border)',
          borderRadius: 3, padding: '1px 5px',
        }}>
          {recent.length}
        </span>
      </div>

      {/* Tweet list */}
      <div className="panel-scroll" style={{ overflowY: 'auto', flex: 1 }}>
        {recent.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            No alerts yet
          </div>
        ) : (
          recent.map((alert) => {
            const color = STATUS_COLORS[alert.status] || '#8b949e';
            return (
              <div
                key={alert._id}
                onClick={() => onAlertClick(alert)}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel-alt)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Top row: event type + status + time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    padding: '1px 5px',
                    border: '1px solid var(--border)',
                    borderRadius: 2,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: 'var(--bg-panel-alt)',
                  }}>
                    {alert.event_type}
                  </span>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {timeAgo(alert.timestamp)}
                  </span>
                </div>

                {/* Tweet text */}
                <p style={{
                  margin: 0, fontSize: 11.5, color: 'var(--text-primary)',
                  lineHeight: 1.4, display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {alert.text}
                </p>

                {/* Bottom row: username + source */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: 10 }}>
                  <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
                    @{alert.username}
                  </span>
                  {alert.tweet_url && (
                    <a
                      href={alert.tweet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        color: '#1d9bf0', display: 'flex', alignItems: 'center',
                        gap: 2, marginLeft: 'auto', textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
