import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { RotateCcw, Search, Loader2, MapPin, X, ChevronDown, ChevronUp } from 'lucide-react';
import { STATUS_COLORS, EVENT_TYPES } from '../utils/constants';

// ── Debounce ────────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

// ── Pure helpers ─────────────────────────────────────────────────────────────
function getPhotonName(f) {
  const p = f.properties || {};
  return p.name || p.city || p.district || '';
}

function buildLabel(f) {
  const p = f.properties || {};
  const primary = getPhotonName(f);
  const parts = [];
  if (p.city   && p.city   !== primary) parts.push(p.city);
  if (p.county && p.county !== primary) parts.push(p.county);
  if (p.state  && p.state  !== primary) parts.push(p.state);
  return { primary, secondary: parts.join(', ') };
}

function scorePhoton(f, rawQ) {
  const q    = rawQ.toLowerCase().trim();
  const p    = f.properties || {};
  const name = (p.name || '').toLowerCase();
  const city = (p.city || '').toLowerCase();
  if (!name && !city) return -1;
  if (name === q)          return 300;
  if (name.startsWith(q)) return 200;
  if (name.includes(q))   return 100;
  if (city === q)          return 250;
  if (city.startsWith(q)) return 150;
  if (city.includes(q))   return 80;
  return -1;
}

function minScore(len) { return len <= 2 ? 200 : 80; }

function HighlightMatch({ text, query }) {
  if (!query || !text) return <span>{text}</span>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex   = new RegExp(`(${escaped})`, 'gi');
  const parts   = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} style={{ background: 'transparent', color: '#4ade80', fontWeight: 600 }}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Sidebar({ filters, setFilters }) {
  const [inputValue,   setInputValue]   = useState(filters.location || '');
  const [suggestions,  setSuggestions]  = useState([]);
  const [isFetching,   setIsFetching]   = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex,  setActiveIndex]  = useState(-1);
  const [collapsed,    setCollapsed]    = useState(false); // mobile collapse

  const wrapperRef = useRef(null);
  const abortRef   = useRef(null);

  const debouncedInput = useDebounce(inputValue, 380);

  // ── Photon autocomplete ──────────────────────────────────────────────────
  useEffect(() => {
    const query = debouncedInput.trim();
    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);

    if (query.length < 2) { setIsFetching(false); return; }

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsFetching(true);

    axios.get('https://photon.komoot.io/api/', {
      signal: ctrl.signal,
      params: { q: query, limit: 20, lang: 'en', lat: 20.5937, lon: 78.9629, bbox: '68.7,8.4,97.25,37.6' },
    })
    .then(res => {
      if (ctrl.signal.aborted) return;
      const features = (res.data?.features || [])
        .filter(f => (f.properties?.countrycode || '').toUpperCase() === 'IN');
      const threshold = minScore(query.length);
      const scored = features
        .map(f => ({ f, score: scorePhoton(f, query) }))
        .filter(({ score }) => score >= threshold)
        .sort((a, b) => b.score - a.score);
      const seen = new Set();
      const result = [];
      for (const { f } of scored) {
        const key = getPhotonName(f).toLowerCase();
        if (key && !seen.has(key)) { seen.add(key); result.push(f); }
        if (result.length >= 6) break;
      }
      setSuggestions(result);
      setShowDropdown(result.length > 0);
      setActiveIndex(-1);
    })
    .catch(err => {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      setSuggestions([]);
    })
    .finally(() => { if (!ctrl.signal.aborted) setIsFetching(false); });

    return () => { ctrl.abort(); };
  }, [debouncedInput]);

  // ── Outside click ────────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Selection ────────────────────────────────────────────────────────────
  const selectSuggestion = useCallback((f) => {
    const { primary } = buildLabel(f);
    const [lon, lat]  = f.geometry?.coordinates || [null, null];
    setInputValue(primary);
    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    setFilters(prev => ({
      ...prev,
      location: primary,
      locationCoords: lat != null ? { lat, lon } : null,
    }));
  }, [setFilters]);

  const handleKeyDown = e => {
    if (!showDropdown || !suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp')  { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter')    { e.preventDefault(); const idx = activeIndex >= 0 ? activeIndex : 0; if (suggestions[idx]) selectSuggestion(suggestions[idx]); }
    else if (e.key === 'Escape')   { setShowDropdown(false); }
  };

  const clearLocation = () => {
    if (abortRef.current) abortRef.current.abort();
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
    setIsFetching(false);
    setFilters(prev => ({ ...prev, location: '', locationCoords: null }));
  };

  const toggleStatus = status => {
    setFilters(prev => {
      const cur = prev.status || [];
      return { ...prev, status: cur.includes(status) ? cur.filter(s => s !== status) : [...cur, status] };
    });
  };

  const toggleEventType = et => {
    setFilters(prev => {
      const cur = prev.eventType || [];
      return { ...prev, eventType: cur.includes(et) ? cur.filter(e => e !== et) : [...cur, et] };
    });
  };

  const resetFilters = () => {
    if (abortRef.current) abortRef.current.abort();
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
    setIsFetching(false);
    setFilters({ status: [], eventType: [], location: '', locationCoords: null, radius: 0 });
  };

  const radius = filters.radius ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: 240,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      position: 'relative',
      zIndex: 10,
      pointerEvents: 'auto',
      overflow: 'hidden',
    }}>
      {/* ── Panel header ── */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          Filters
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={resetFilters}
            title="Reset all filters"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 2, display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="panel-scroll" style={{ overflowY: 'auto', flex: 1, padding: '12px 14px' }}>

        {/* Verification Status */}
        <section className="filter-section">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Verification Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(STATUS_COLORS).map(([status, color]) => {
              const checked = filters.status?.includes(status);
              return (
                <label key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <div
                    className={`check-box ${checked ? 'checked' : ''}`}
                    style={{ backgroundColor: checked ? color : 'transparent', borderColor: checked ? color : 'var(--border)' }}
                    onClick={() => toggleStatus(status)}
                  >
                    {checked && (
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" style={{ display: 'none' }} checked={checked || false} onChange={() => toggleStatus(status)} />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', userSelect: 'none' }}>{status}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, marginLeft: 'auto', flexShrink: 0 }} />
                </label>
              );
            })}
          </div>
        </section>

        {/* Event Type */}
        <section className="filter-section">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Event Type
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {EVENT_TYPES.map(type => {
              const checked = filters.eventType?.includes(type);
              return (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <div
                    className={`check-box ${checked ? 'checked' : ''}`}
                    style={{ backgroundColor: checked ? 'var(--accent)' : 'transparent', borderColor: checked ? 'var(--accent)' : 'var(--border)' }}
                    onClick={() => toggleEventType(type)}
                  >
                    {checked && (
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" style={{ display: 'none' }} checked={checked || false} onChange={() => toggleEventType(type)} />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', userSelect: 'none' }}>{type}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Location search */}
        <section className="filter-section">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Location
          </div>

          <div ref={wrapperRef} style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              {isFetching
                ? <Loader2 size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', animation: 'spin 1s linear infinite', pointerEvents: 'none' }} />
                : <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              }
              <input
                id="location-search"
                type="text"
                autoComplete="off"
                placeholder="Search city or region…"
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); if (!e.target.value) clearLocation(); }}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%',
                  background: 'var(--bg-panel-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: 5,
                  padding: '7px 28px 7px 28px',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocusCapture={e => e.target.style.borderColor = 'var(--accent)'}
                onBlurCapture={e => e.target.style.borderColor = 'var(--border)'}
              />
              {inputValue && (
                <button onClick={clearLocation} style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  padding: 0, display: 'flex',
                }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 100,
                background: 'var(--bg-panel-alt)',
                border: '1px solid var(--border)',
                borderTop: 'none',
                borderRadius: '0 0 5px 5px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                maxHeight: 220,
                overflowY: 'auto',
              }}>
                {suggestions.map((f, idx) => {
                  const { primary, secondary } = buildLabel(f);
                  const isActive = activeIndex === idx;
                  return (
                    <div
                      key={`${f.properties?.osm_id}-${idx}`}
                      className={`suggestion-item ${isActive ? 'active' : ''}`}
                      onMouseDown={() => selectSuggestion(f)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <MapPin size={11} style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          <HighlightMatch text={primary} query={inputValue} />
                        </div>
                        {secondary && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1, lineHeight: 1.2 }}>
                            <HighlightMatch text={secondary} query={inputValue} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No results */}
            {!isFetching && showDropdown && suggestions.length === 0 && debouncedInput.trim().length >= 2 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                background: 'var(--bg-panel-alt)', border: '1px solid var(--border)',
                borderTop: 'none', borderRadius: '0 0 5px 5px',
                padding: '10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center',
              }}>
                No locations found
              </div>
            )}
          </div>

          {/* Active badge */}
          {filters.location && (
            <div style={{
              marginTop: 6,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--accent-dim)',
              border: '1px solid rgba(22,163,74,0.25)',
              borderRadius: 4,
              padding: '5px 8px',
            }}>
              <MapPin size={11} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--accent-light)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {filters.location}
              </span>
              <button onClick={clearLocation} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                <X size={11} />
              </button>
            </div>
          )}
        </section>

        {/* Radius */}
        <section className="filter-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Radius
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)' }}>
              {radius} km
            </span>
          </div>
          <input
            id="location-radius"
            type="range"
            min={0} max={200} step={5}
            value={radius}
            onChange={e => setFilters(prev => ({ ...prev, radius: Number(e.target.value) }))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
            <span>0 km</span><span>200 km</span>
          </div>
        </section>
      </div>
    </div>
  );
}
