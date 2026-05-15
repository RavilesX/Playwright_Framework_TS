/* global React */
const { useState, useMemo, useEffect, useRef } = React;

// ============ Icons (inline SVG, minimal) ============
const Icon = {
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>,
  Filter: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M10 18h4"/></svg>,
  Chevron: ({open}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{transform: open ? 'rotate(90deg)' : 'none', transition: '120ms'}}><path d="m9 6 6 6-6 6"/></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>,
  X: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  Bolt: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-2 8 9-12h-6l2-8z"/></svg>,
  Skip: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 5v14M19 5v14M9 12h6"/></svg>,
  Play: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  Refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/></svg>,
  External: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4h6v6M20 4l-9 9M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></svg>,
  Git: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="12" r="3"/><path d="M6 9v6M9 12h6"/></svg>,
  Clock: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  Tests: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 2h6v6l5 11a2 2 0 0 1-2 3H6a2 2 0 0 1-2-3l5-11V2z"/></svg>,
  Chart: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M7 16v-6m5 6v-9m5 9v-4"/></svg>,
  Sparkles: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 5L19 8.5 13.5 10 12 15l-1.5-5L5 8.5 10.5 7z"/></svg>,
  Folder: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  Settings: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>,
  Camera: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/></svg>,
  Film: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 12h18M3 7.5h4M3 16.5h4M17 7.5h4M17 16.5h4"/></svg>,
  Trace: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l3-7 4 14 3-7h4"/></svg>,
  Copy: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>,
};

// ============ Browser glyph (original, not the real browser logos) ============
function BrowserGlyph({ name }) {
  const map = {
    chromium: { letter: "Ch", c1: "oklch(0.78 0.16 235)", c2: "oklch(0.78 0.18 60)" },
    firefox: { letter: "Fx", c1: "oklch(0.78 0.18 60)", c2: "oklch(0.72 0.21 25)" },
    webkit: { letter: "Wk", c1: "oklch(0.85 0.05 250)", c2: "oklch(0.55 0.05 250)" },
    "Mobile Safari": { letter: "iOS", c1: "oklch(0.78 0.14 285)", c2: "oklch(0.55 0.14 285)" },
  };
  const g = map[name] || map.chromium;
  return (
    <div className="browser-icon" style={{ background: `linear-gradient(135deg, ${g.c1}, ${g.c2})`, color: "#0a0e1a" }}>
      {g.letter}
    </div>
  );
}

// ============ Pass-rate gauge ============
function Gauge({ passed, failed, flaky, skipped, total }) {
  const R = 70, C = 2 * Math.PI * R;
  const pPass = passed / total;
  const pFail = failed / total;
  const pFlaky = flaky / total;
  const pSkip = skipped / total;
  const segs = [
    { p: pPass, color: "var(--pass)" },
    { p: pFail, color: "var(--fail)" },
    { p: pFlaky, color: "var(--flaky)" },
    { p: pSkip, color: "var(--skip)" },
  ];
  let offset = 0;
  return (
    <div className="gauge">
      <svg viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={R} stroke="var(--bg-2)" strokeWidth="14" fill="none" />
        {segs.map((s, i) => {
          const len = s.p * C;
          const dash = `${len} ${C - len}`;
          const dashOffset = -offset;
          offset += len;
          return (
            <circle key={i} cx="80" cy="80" r={R} stroke={s.color} strokeWidth="14" fill="none"
              strokeDasharray={dash} strokeDashoffset={dashOffset} strokeLinecap="butt" />
          );
        })}
      </svg>
      <div className="center">
        <div>
          <div className="pct">{Math.round(pPass * 100)}<span style={{fontSize:18, color:'var(--muted)'}}>%</span></div>
          <div className="lbl">Pass rate</div>
        </div>
      </div>
    </div>
  );
}

// ============ Status sparkline (mini SVG line) ============
function Sparkline({ values, color = "var(--accent)", height = 36, width = 96 }) {
  if (!values.length) return null;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2]);
  const d = points.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = `${d} L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} className="spark">
      <path d={area} fill={color} opacity="0.15" stroke="none" />
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ============ Stacked trend bar chart ============
function TrendChart({ trend }) {
  const maxTotal = Math.max(...trend.map(r => r.passed + r.failed + r.flaky));
  return (
    <>
      <div className="trend">
        {trend.map((r, i) => {
          const total = r.passed + r.failed + r.flaky;
          const scale = 200 / maxTotal;
          const isCurrent = i === trend.length - 1;
          return (
            <div className="trend-bar" key={i} style={{ height: total * scale + "px", opacity: isCurrent ? 1 : 0.85 }}>
              {r.flaky > 0 && <div className="seg flaky" style={{ height: (r.flaky * scale) + "px" }}/>}
              {r.failed > 0 && <div className="seg failed" style={{ height: (r.failed * scale) + "px" }}/>}
              <div className="seg passed" style={{ height: (r.passed * scale) + "px" }}/>
              <div className="tip">
                <div>{r.run} · {r.ago}</div>
                <div style={{color:"var(--pass)"}}>passed {r.passed}</div>
                <div style={{color:"var(--fail)"}}>failed {r.failed}</div>
                <div style={{color:"var(--flaky)"}}>flaky {r.flaky}</div>
                <div style={{color:"var(--muted)"}}>{r.duration}s</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="trend-axis">
        {trend.map((r, i) => (
          <div key={i} className={i === trend.length - 1 ? "trend-current" : ""}>{r.run.replace("#","")}</div>
        ))}
      </div>
    </>
  );
}

Object.assign(window, { Icon, BrowserGlyph, Gauge, Sparkline, TrendChart });
