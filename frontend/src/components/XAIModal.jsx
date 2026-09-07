import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, ShieldAlert, CloudRain, Thermometer, Wind, Droplets, Eye, Users, Radio, MapPin, Layers, FileImage, Cpu } from 'lucide-react';
import { STATUS_COLORS } from '../utils/constants';

// ── Constants ────────────────────────────────────────────────────────────────
const STATUS_ICONS = {
  Verified: CheckCircle,
  Emerging: AlertTriangle,
  Flagged:  ShieldAlert,
};

const RISK_LEVELS = {
  Verified: { label: 'High Confidence', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' },
  Emerging: { label: 'Moderate Risk',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  Flagged:  { label: 'Low Credibility', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)'  },
};

const RECOMMENDATIONS = {
  Verified: {
    Flood:        ['Issue evacuation advisory for low-lying areas', 'Deploy NDRF teams to affected zone', 'Alert downstream dam operators'],
    Heatwave:     ['Open cooling centres in affected district', 'Issue heat health advisory', 'Restrict outdoor work 12–4 PM'],
    Cyclone:      ['Activate district emergency operations centre', 'Move fishing vessels to harbour', 'Prepare shelters within 10 km radius'],
    'Heavy Rain': ['Clear storm drains in affected areas', 'Monitor river gauges every 2 hours', 'Alert road clearance teams'],
    Wind:         ['Secure temporary structures', 'Alert power distribution companies', 'Issue travel advisory'],
  },
  Emerging: {
    Flood:        ['Monitor water levels at nearby gauges', 'Pre-position rescue boats', 'Alert Tehsildar of affected area'],
    Heatwave:     ['Activate heat action plan', 'Increase water supply in affected area', 'Monitor vulnerable population'],
    Cyclone:      ['Initiate precautionary measures', 'Monitor IMD bulletins every 3 hours', 'Alert coastal communities'],
    'Heavy Rain': ['Issue advisory to avoid travel in low-lying areas', 'Monitor situation for 6 hours'],
    Wind:         ['Monitor wind speed at nearest AWS station', 'Advisory for high-rise construction sites'],
  },
  Flagged: {
    Flood:        ['Cross-check with nearest rain gauge station', 'Request ground-truth from local administration'],
    Heatwave:     ['Verify with nearest IMD surface station temperature'],
    Cyclone:      ['Verify with IMD NWP model output', 'Check INSAT-3D satellite imagery'],
    'Heavy Rain': ['Cross-check with district rainfall data'],
    Wind:         ['Verify with nearest anemometer reading'],
  },
};

// WMO Weather Code → description
function wmoDescription(code) {
  if (code === 0)              return 'Clear sky';
  if (code <= 3)               return 'Partly cloudy';
  if (code <= 9)               return 'Foggy / hazy';
  if (code <= 19)              return 'Light precipitation';
  if (code <= 29)              return 'Drizzle';
  if (code <= 39)              return 'Rain';
  if (code <= 49)              return 'Freezing drizzle';
  if (code <= 59)              return 'Moderate rain';
  if (code <= 69)              return 'Snow';
  if (code <= 79)              return 'Snow grains';
  if (code <= 84)              return 'Showers';
  if (code <= 89)              return 'Thunderstorm';
  if (code <= 99)              return 'Heavy thunderstorm';
  return 'Unknown';
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ScoreBar({ pct, color, animated = true }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!animated) { setWidth(pct); return; }
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct, animated]);

  return (
    <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${width}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  );
}

function WeatherCard({ icon: Icon, label, value, unit, sub }) {
  return (
    <div style={{
      background: 'var(--bg-panel-alt)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
        <Icon size={11} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 2 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function XAIModal({ alert, onClose }) {
  const [weather, setWeather]       = useState(null);
  const [wxLoading, setWxLoading]   = useState(false);

  // Fetch live weather from Open-Meteo (same API the backend uses)
  useEffect(() => {
    if (!alert) { setWeather(null); return; }
    const coords = alert.location?.coordinates;
    if (!coords) return;

    const [lng, lat] = coords;
    setWxLoading(true);
    setWeather(null);

    const controller = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=relative_humidity_2m,visibility&timezone=auto&forecast_days=1`,
      { signal: controller.signal }
    )
      .then(r => r.json())
      .then(data => {
        const cw  = data.current_weather || {};
        const h   = data.hourly || {};
        // Pick the humidity + visibility value closest to now
        const humidity    = Array.isArray(h.relative_humidity_2m) ? h.relative_humidity_2m[0] : null;
        const visibility  = Array.isArray(h.visibility)           ? h.visibility[0]           : null;
        setWeather({
          temp:        cw.temperature  ?? null,
          windspeed:   cw.windspeed    ?? null,
          code:        cw.weathercode  ?? null,
          isDay:       cw.is_day,
          humidity,
          visibility,
        });
      })
      .catch(() => {}) // silent fail — backend already has this data
      .finally(() => setWxLoading(false));

    return () => controller.abort();
  }, [alert?._id]);

  if (!alert) return null;

  // ── Derived values ──
  const color           = STATUS_COLORS[alert.status] || '#8b949e';
  const risk            = RISK_LEVELS[alert.status]   || RISK_LEVELS.Flagged;
  const StatusIcon      = STATUS_ICONS[alert.status]  || ShieldAlert;

  const mlPct           = Math.round((alert.ml_confidence    || 0) * 100);
  const wxPct           = Math.round((alert.weather_score    || 0) * 100);
  const isClustered     = !!alert.cluster_id;
  const crowdPct        = isClustered ? 100 : 0;
  const credibilityPct  = Math.round((alert.credibility_score || 0) * 100);

  // Score breakdown labels (mirrors credibility.py weights: 40% NLP, 40% Weather, 20% Crowd)
  const scoreRows = [
    { label: 'NLP Confidence',    pct: mlPct,    color: '#3b82f6', weight: '40%', icon: Cpu      },
    { label: 'Weather API Match', pct: wxPct,    color: '#06b6d4', weight: '40%', icon: CloudRain },
    { label: 'Crowd Correlation', pct: crowdPct, color: '#8b5cf6', weight: '20%', icon: Users     },
  ];

  const recs = (RECOMMENDATIONS[alert.status] || {})[alert.event_type] || [
    'Monitor situation closely',
    'Await further updates from IMD',
  ];

  const coords = alert.location?.coordinates;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '92vh',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0,
          gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Tags row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7, flexWrap: 'wrap' }}>
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
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '2px 7px',
                border: `1px solid ${risk.border}`,
                borderRadius: 3,
                color: risk.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: risk.bg,
              }}>
                {alert.status}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {new Date(alert.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>

            {/* Tweet text */}
            <p style={{ margin: '0 0 5px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.45, fontStyle: 'italic' }}>
              "{alert.text}"
            </p>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>@{alert.username}</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Users size={10} style={{ color: 'var(--text-muted)' }} />
                {(alert.followers || 0).toLocaleString()} followers
              </span>
              {coords && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={10} style={{ color: 'var(--text-muted)' }} />
                    {coords[1].toFixed(2)}°N, {coords[0].toFixed(2)}°E
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 2, display: 'flex',
              transition: 'color 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="panel-scroll" style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Credibility Score ── */}
          <div style={{
            background: risk.bg,
            border: `1px solid ${risk.border}`,
            borderRadius: 8,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none" stroke={color} strokeWidth="5"
                  strokeDasharray={`${(credibilityPct / 100) * 163.4} 163.4`}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: 'var(--text-primary)',
              }}>
                {credibilityPct}%
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                Final Credibility Score
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <StatusIcon size={18} style={{ color }} />
                <span style={{ fontSize: 16, fontWeight: 700, color }}>
                  {risk.label}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {alert.status === 'Verified'
                  ? 'AI + weather data strongly support this report.'
                  : alert.status === 'Emerging'
                  ? 'Partial evidence — monitoring recommended.'
                  : 'Insufficient corroboration. Manual review needed.'}
              </div>
            </div>
          </div>

          {/* ── XAI Score Breakdown ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Explainable AI Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {scoreRows.map(({ label, pct, color: c, weight, icon: Icon }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon size={11} style={{ color: c }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-panel-alt)', border: '1px solid var(--border)', borderRadius: 3, padding: '0 4px' }}>
                        {weight}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <ScoreBar pct={pct} color={c} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg-panel-alt)', border: '1px solid var(--border)', borderRadius: 5, fontSize: 11, color: 'var(--text-muted)' }}>
              Score formula: <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>0.4×NLP + 0.4×Weather + 0.2×Crowd = {credibilityPct}%</span>
            </div>
          </div>

          {/* ── Live Weather Data ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              Live Weather at Location
              {wxLoading && (
                <span style={{ fontSize: 10, color: 'var(--accent-light)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                  fetching…
                </span>
              )}
              {weather && !wxLoading && (
                <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 500, textTransform: 'none', letterSpacing: 0, marginLeft: 'auto' }}>
                  ● Live · Open-Meteo
                </span>
              )}
            </div>

            {weather ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <WeatherCard icon={Thermometer} label="Temperature"  value={weather.temp   ?? '—'} unit="°C"   sub={weather.temp > 38 ? '🔴 Extreme heat' : weather.temp > 32 ? '🟠 High heat' : ''}   />
                  <WeatherCard icon={Wind}        label="Wind Speed"   value={weather.windspeed ?? '—'} unit="km/h" sub={weather.windspeed > 50 ? '🔴 Storm-force' : weather.windspeed > 30 ? '🟠 Strong wind' : ''} />
                  {weather.humidity != null && (
                    <WeatherCard icon={Droplets} label="Humidity" value={weather.humidity} unit="%" sub={weather.humidity > 85 ? 'Very high — rain likely' : ''} />
                  )}
                  {weather.visibility != null && (
                    <WeatherCard icon={Eye} label="Visibility" value={(weather.visibility / 1000).toFixed(1)} unit="km" sub={weather.visibility < 1000 ? '🟠 Poor visibility' : ''} />
                  )}
                </div>
                <div style={{
                  background: 'var(--bg-panel-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <Radio size={12} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
                  <span>
                    WMO code <strong style={{ color: 'var(--text-primary)' }}>{weather.code}</strong> — {wmoDescription(weather.code)}
                    {weather.isDay === 1 ? ' (daytime)' : weather.isDay === 0 ? ' (night)' : ''}
                  </span>
                </div>
              </>
            ) : !wxLoading ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 0' }}>
                Weather data unavailable for this location.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ height: 68, background: 'var(--bg-panel-alt)', border: '1px solid var(--border)', borderRadius: 6, opacity: 0.5 }} />
                ))}
              </div>
            )}
          </div>

          {/* ── Recommendations ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Recommended Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recs.map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '8px 10px',
                  background: 'var(--bg-panel-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: 5,
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    minWidth: 18, height: 18,
                    borderRadius: '50%',
                    background: color,
                    color: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Metadata Grid ── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <MetaItem label="Source"           value={(alert.source || 'Unknown').toUpperCase()} />
            <MetaItem label="Location Method"  value={alert.location_source === 'gps' ? 'Device GPS' : 'NER AI Model'} />
            <MetaItem label="Media Attached"   value={alert.has_media ? '✓ Yes' : 'None'} />
            <MetaItem label="Cluster"          value={isClustered ? `Active #${alert.cluster_id}` : 'None'} />
            <MetaItem label="Cluster Bonus"    value={isClustered ? '+20% credibility' : 'Not clustered'} />
            <MetaItem label="Alert ID"         value={`…${(alert._id || '').slice(-8)}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
