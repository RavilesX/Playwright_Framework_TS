/* global React, ReactDOM, Icon, BrowserGlyph, Gauge, Sparkline, TrendChart, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakSelect */
const { useState, useMemo, useEffect, useContext, createContext } = React;

const ALL_DATA = window.REPORT_DATA;
const ALL_RUNS = ALL_DATA.runs;
const GLOBAL_TREND = ALL_DATA.trend;

const RunContext = createContext(null);
const useRun = () => useContext(RunContext);

const STATUS_META = {
  passed: { c: "var(--pass)", icon: <Icon.Check/>, label: "Passed" },
  failed: { c: "var(--fail)", icon: <Icon.X/>, label: "Failed" },
  flaky:  { c: "var(--flaky)", icon: <Icon.Bolt/>, label: "Flaky" },
  skipped:{ c: "var(--skip)", icon: <Icon.Skip/>, label: "Skipped" },
};

function fmt(ms) {
  if (ms < 1000) return ms + "ms";
  if (ms < 60000) return (ms / 1000).toFixed(1) + "s";
  return Math.floor(ms / 60000) + "m " + Math.round((ms % 60000) / 1000) + "s";
}

function fmtTotal(ms) {
  const m = Math.floor(ms / 60000), s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

// =============== Hero ===============
function Hero() {
  const D = useRun();
  const s = D.summary;
  return (
    <div className="hero">
      <div className="hero-main">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,position:"relative"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span className="pill live"><span className="dot"/>RUN {D.meta.runId}</span>
              <span className="pill"><Icon.Git/> {D.meta.branch} · <span className="mono" style={{color:"var(--text)"}}>{D.meta.commit}</span></span>
              <span className="pill"><Icon.Clock/> {D.meta.startedAt}</span>
            </div>
            <div className="hero-title" style={{display:"inline-flex",alignItems:"center",gap:10}}>
              <Icon.Playwright/>
              <span>Playwright Automation Framework + JS</span>
              <Icon.Js/>
            </div>
            <div className="hero-sub">
              by <span style={{color:"var(--text)"}}>@{D.meta.author}</span> · {D.meta.ci} · {D.meta.runner} · {D.meta.shards} shards · {D.meta.workers} workers
            </div>
          </div>
        </div>

        <div className="hero-grid">
          <div className="stat passed">
            <div className="label">Passed</div>
            <div className="val passed">{s.passed}</div>
            <div className="sub">{((s.passed / s.total) * 100).toFixed(1)}% of {s.total}</div>
          </div>
          <div className="stat failed">
            <div className="label">Failed</div>
            <div className="val failed">{s.failed}</div>
            <div className="sub">{s.failed > 0 ? `${s.failed} test${s.failed>1?"s":""} need attention` : "All clear"}</div>
          </div>
          <div className="stat flaky">
            <div className="label">Flaky</div>
            <div className="val flaky">{s.flaky}</div>
            <div className="sub">{s.flaky > 0 ? "passed on retry" : "none detected"}</div>
          </div>
          <div className="stat skipped">
            <div className="label">Skipped</div>
            <div className="val skipped">{s.skipped}</div>
            <div className="sub">via .skip / .fixme</div>
          </div>
          <div className="stat duration">
            <div className="label">Duration</div>
            <div className="val duration">{fmtTotal(s.duration)}</div>
            <div className="sub">wall clock</div>
          </div>
        </div>
      </div>

      <div className="hero-side">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div className="card-title">Status breakdown</div>
          <div className="mono" style={{fontSize:11,color:"var(--muted)"}}>{s.total} tests</div>
        </div>
        <div className="gauge-wrap">
          <Gauge {...s} />
          <div className="legend">
            <div className="legend-row"><span className="sw" style={{background:"var(--pass)"}}/><span className="name">Passed</span><span className="val">{s.passed}</span></div>
            <div className="legend-row"><span className="sw" style={{background:"var(--fail)"}}/><span className="name">Failed</span><span className="val">{s.failed}</span></div>
            <div className="legend-row"><span className="sw" style={{background:"var(--flaky)"}}/><span className="name">Flaky</span><span className="val">{s.flaky}</span></div>
            <div className="legend-row"><span className="sw" style={{background:"var(--skip)"}}/><span className="name">Skipped</span><span className="val">{s.skipped}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============== Charts row ===============
function ChartsRow({ runIdx, onSelectRun }) {
  const D = useRun();
  const projectBreakdown = useMemo(() => {
    const map = {};
    D.tests.forEach(t => {
      if (!map[t.project]) map[t.project] = { passed:0, failed:0, flaky:0, skipped:0, total:0 };
      map[t.project][t.status]++;
      map[t.project].total++;
    });
    return Object.entries(map);
  }, [D]);

  if (GLOBAL_TREND.length < 2) return null;

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-h">
          <div className="card-title">Last {GLOBAL_TREND.length} runs · stacked outcomes</div>
          <div style={{display:"flex",gap:14,fontSize:11,color:"var(--muted)"}} className="mono">
            <span><span style={{display:"inline-block",width:8,height:8,background:"var(--pass)",borderRadius:2,marginRight:6}}/>passed</span>
            <span><span style={{display:"inline-block",width:8,height:8,background:"var(--fail)",borderRadius:2,marginRight:6}}/>failed</span>
            <span><span style={{display:"inline-block",width:8,height:8,background:"var(--flaky)",borderRadius:2,marginRight:6}}/>flaky</span>
          </div>
        </div>
        <div className="card-body">
          <TrendChart trend={GLOBAL_TREND} currentIdx={runIdx} onSelect={onSelectRun} />
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div className="card-title">By browser project</div>
          <span className="mono" style={{fontSize:11,color:"var(--muted)"}}>{D.summary.total} tests</span>
        </div>
        <div className="card-body">
          <div className="browser-list">
            {projectBreakdown.map(([name, b]) => {
              const total = b.total;
              return (
                <div className="browser-row" key={name}>
                  <BrowserGlyph name={name}/>
                  <div className="browser-name mono">{name}</div>
                  <div className="browser-bar">
                    <div className="b-seg passed" style={{width: (b.passed/total*100)+"%"}}/>
                    <div className="b-seg failed" style={{width: (b.failed/total*100)+"%"}}/>
                    <div className="b-seg flaky"  style={{width: (b.flaky/total*100)+"%"}}/>
                    <div className="b-seg skipped"style={{width: (b.skipped/total*100)+"%"}}/>
                  </div>
                  <div className="browser-meta">{Math.round(b.passed/total*100)}% · {total}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============== Slowest + Top failing ===============
function SecondaryRow() {
  const D = useRun();
  const failedTests = useMemo(() => D.tests.filter(t => t.status === "failed"), [D]);
  if (failedTests.length === 0 && D.slowest.length === 0) return null;

  return (
    <div className="grid-3">
      {failedTests.length > 0 && (
        <div className="card">
          <div className="card-h">
            <div className="card-title">Top failing files</div>
            <span className="mono" style={{fontSize:11,color:"var(--muted)"}}>this run</span>
          </div>
          <div className="card-body" style={{paddingTop:6}}>
            {Object.entries(failedTests.reduce((a,t)=>{a[t.file]=(a[t.file]||0)+1; return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([file,count])=>(
              <div className="slow-row" key={file}>
                <div>
                  <div className="slow-title mono" style={{fontSize:12}}>{file}</div>
                  <div className="slow-meta">{count} test{count>1?"s":""} failed</div>
                </div>
                <div className="slow-time" style={{color:"var(--fail)"}}>{count}×</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {D.slowest.length > 0 && (
        <div className="card">
          <div className="card-h">
            <div className="card-title">Slowest tests</div>
            <span className="mono" style={{fontSize:11,color:"var(--muted)"}}>top {D.slowest.length}</span>
          </div>
          <div className="card-body" style={{paddingTop:6}}>
            {D.slowest.map(t => (
              <div className="slow-row" key={t.id}>
                <div>
                  <div className="slow-title">{t.title}</div>
                  <div className="slow-meta">{t.file} · {t.project}</div>
                </div>
                <div className="slow-time">{fmt(t.duration)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============== Filters ===============
function Filters({ query, setQuery, status, setStatus, project, setProject }) {
  const D = useRun();
  const counts = useMemo(() => {
    const c = { all: D.tests.length, passed:0, failed:0, flaky:0, skipped:0 };
    D.tests.forEach(t => c[t.status]++);
    return c;
  }, [D]);
  return (
    <div className="filters">
      <div className="search">
        <span className="search-icon"><Icon.Search/></span>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter tests, files, errors…" />
      </div>
      <div style={{display:"flex",gap:6}}>
        {["all","passed","failed","flaky","skipped"].map(s => (
          <button key={s} className={"chip " + (status===s?"active":"")} onClick={() => setStatus(s)}>
            {s !== "all" && <span className="dot" style={{background: STATUS_META[s]?.c || "var(--muted)"}}/>}
            {s}
            <span className="count">{counts[s]}</span>
          </button>
        ))}
      </div>
      <div style={{width:1,height:20,background:"var(--line-soft)",margin:"0 4px"}}/>
      <select value={project} onChange={e=>setProject(e.target.value)} style={{background:"var(--bg-2)",border:"1px solid var(--line-soft)",borderRadius:8,padding:"7px 10px",color:"var(--text)",fontSize:12,fontFamily:"var(--font-mono)"}}>
        <option value="all">all browsers</option>
        {D.projects.map(p => <option key={p}>{p}</option>)}
      </select>
    </div>
  );
}

// =============== Test detail (real data) ===============
function TestDetail({ test }) {
  const defaultTab = test.status === "failed" ? "error" : (test.steps && test.steps.length > 0 ? "steps" : "logs");
  const [tab, setTab] = useState(defaultTab);

  const hasSteps = test.steps && test.steps.length > 0;
  const hasAttachments = test.attachments && test.attachments.some(a => a.path);
  const hasStdout = test.stdout && test.stdout.length > 0;
  const hasStderr = test.stderr && test.stderr.length > 0;

  return (
    <div className="test-detail">
      <div className="detail-tabs">
        {test.status === "failed" && <div className={"detail-tab "+(tab==="error"?"active":"")} onClick={()=>setTab("error")}>Error</div>}
        {hasSteps && <div className={"detail-tab "+(tab==="steps"?"active":"")} onClick={()=>setTab("steps")}>Steps</div>}
        {hasAttachments && <div className={"detail-tab "+(tab==="att"?"active":"")} onClick={()=>setTab("att")}>Attachments</div>}
        {(hasStdout || hasStderr) && <div className={"detail-tab "+(tab==="logs"?"active":"")} onClick={()=>setTab("logs")}>Stdout</div>}
        {!test.status === "failed" && !hasSteps && !hasAttachments && !hasStdout && !hasStderr && (
          <div className="detail-tab active">No details</div>
        )}
      </div>

      {tab === "error" && test.errorMessage && (
        <>
          <div className="err-banner">
            <Icon.X/>
            <div>
              <div style={{fontWeight:600,marginBottom:4}}>
                {test.errorLine ? `Assertion failed at ${test.file}:${test.errorLine}` : `Test failed: ${test.file}`}
              </div>
              <div style={{color:"oklch(0.92 0.05 25)",fontFamily:"var(--font-mono)",fontSize:12,whiteSpace:"pre-wrap"}}>{test.errorMessage}</div>
            </div>
          </div>
          {test.errorStack && (
            <div className="code-block" style={{whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",fontSize:11,color:"var(--muted)"}}>
              {test.errorStack}
            </div>
          )}
        </>
      )}

      {tab === "steps" && hasSteps && (
        <div className="steps-list">
          {test.steps.map((s, i) => (
            <div key={i} className={"step " + (s.ok?"":"failed")}>
              <span className={"sicon " + (s.ok?"":"failed")}>{s.ok ? "✓" : "✕"}</span>
              <span className="stitle mono" style={{fontSize:12}}>{s.title}</span>
              <span className="stime">{fmt(s.duration)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "att" && (
        <div className="atts">
          {test.attachments.filter(a => a.path).map((a, i) => {
            const isTrace = a.name === "trace" || (a.path && a.path.endsWith(".zip"));
            const isVideo = a.contentType && a.contentType.startsWith("video/");
            const isImage = a.contentType && a.contentType.startsWith("image/");

            if (isTrace && a.path) {
              const isFile = typeof location !== "undefined" && location.protocol === "file:";
              const traceUrl = `trace/index.html?trace=${encodeURIComponent("../" + a.path)}`;
              return (
                <div key={i} style={{padding:"8px 0",borderBottom:"1px dashed var(--line-soft)"}}>
                  <div className="att">
                    <span><Icon.Trace/> {a.name}</span>
                    <span style={{display:"flex",gap:14,alignItems:"center"}}>
                      {!isFile && <a href={traceUrl} target="_blank" rel="noreferrer" style={{color:"var(--accent)"}}>open trace viewer ↗</a>}
                      <a href={a.path} download style={{color:"var(--accent)"}}>download trace.zip ↓</a>
                    </span>
                  </div>
                  {isFile && (
                    <div style={{marginTop:8,padding:"12px 14px",border:"1px solid var(--line-soft)",borderRadius:8,background:"oklch(0.18 0.012 250)",color:"var(--muted)",fontSize:12,lineHeight:1.6}}>
                      <div style={{color:"var(--flaky)",fontWeight:600,marginBottom:6}}>⚠ Trace viewer needs HTTP server</div>
                      Report opened via <span className="mono">file://</span>. Browsers block <span className="mono">fetch()</span> of <span className="mono">trace.zip</span> on file://. Run:
                      <div className="code-block" style={{marginTop:8,padding:"8px 10px"}}>npx playwright show-report</div>
                      Or drop the downloaded <span className="mono">trace.zip</span> into <a href="https://trace.playwright.dev" target="_blank" rel="noreferrer" style={{color:"var(--accent)"}}>trace.playwright.dev</a>.
                    </div>
                  )}
                </div>
              );
            }
            if (isImage && a.path) {
              return (
                <div key={i} style={{padding:"8px 0",borderBottom:"1px dashed var(--line-soft)"}}>
                  <div className="att"><span><Icon.Camera/> {a.name}</span></div>
                  <img src={a.path} alt={a.name} style={{maxWidth:"100%",borderRadius:6,marginTop:8,border:"1px solid var(--line-soft)"}}/>
                </div>
              );
            }
            if (isVideo && a.path) {
              return (
                <div key={i} className="att video">
                  <span><Icon.Film/> {a.name}</span>
                  <a href={a.path} style={{color:"var(--accent)"}} target="_blank" rel="noreferrer">open →</a>
                </div>
              );
            }
            return (
              <div key={i} className="att">
                <span>{a.name}</span>
                <a href={a.path} style={{color:"var(--accent)"}} target="_blank" rel="noreferrer">open →</a>
              </div>
            );
          })}
        </div>
      )}

      {tab === "logs" && (
        <div className="code-block">
          {hasStdout && test.stdout.map((line, i) => (
            <div key={"o"+i} style={{whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",fontSize:11}}>{line}</div>
          ))}
          {hasStderr && test.stderr.map((line, i) => (
            <div key={"e"+i} style={{whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",fontSize:11,color:"var(--fail)"}}>{line}</div>
          ))}
          {!hasStdout && !hasStderr && (
            <div style={{color:"var(--muted)",fontSize:12}}>No output captured</div>
          )}
        </div>
      )}
    </div>
  );
}

function TestRow({ test, open, onToggle, maxDur, openAttempt, onToggleAttempt }) {
  const meta = STATUS_META[test.status];
  const durPct = (test.duration / maxDur) * 100;
  const durClass = test.duration > maxDur * 0.66 ? "veryslow" : test.duration > maxDur * 0.33 ? "slow" : "";
  const attempts = test.attempts || [];
  return (
    <>
      <div className={"test-row " + (open?"open":"")} onClick={onToggle}>
        <div className={"status-icon " + test.status}>{meta.icon}</div>
        <div>
          <div className="test-title">{test.title}</div>
          <div className="test-file">{test.file}</div>
        </div>
        <div className="test-meta">{test.project}</div>
        <div className="test-meta">{test.retries > 0 ? `${test.retries} retr${test.retries>1?"ies":"y"}` : "—"}</div>
        <div className="test-meta">{fmt(test.duration)}</div>
        <div className="duration-cell">
          <div className="duration-bar"><div className={"fill " + durClass} style={{width: Math.min(100, durPct) + "%"}}/></div>
        </div>
        <div style={{color:"var(--muted)"}}><Icon.Chevron open={open}/></div>
      </div>
      {open && <TestDetail test={test} />}
      {attempts.map((att, i) => {
        const attOpen = openAttempt === i;
        const attMeta = STATUS_META[att.status] || STATUS_META.failed;
        const attDurPct = (att.duration / maxDur) * 100;
        const attDurClass = att.duration > maxDur * 0.66 ? "veryslow" : att.duration > maxDur * 0.33 ? "slow" : "";
        return (
          <React.Fragment key={"att-"+i}>
            <div className={"test-row attempt-row " + (attOpen?"open":"")} onClick={() => onToggleAttempt(i)}>
              <div className={"status-icon " + att.status}>{attMeta.icon}</div>
              <div style={{paddingLeft:18}}>
                <div className="test-title" style={{fontSize:13,color:"var(--muted)"}}>↳ attempt #{(att.retry||0)+1} (retry)</div>
                <div className="test-file">{test.title}</div>
              </div>
              <div className="test-meta">{test.project}</div>
              <div className="test-meta">—</div>
              <div className="test-meta">{fmt(att.duration)}</div>
              <div className="duration-cell">
                <div className="duration-bar"><div className={"fill " + attDurClass} style={{width: Math.min(100, attDurPct) + "%"}}/></div>
              </div>
              <div style={{color:"var(--muted)"}}><Icon.Chevron open={attOpen}/></div>
            </div>
            {attOpen && <TestDetail test={{...att, file: test.file, title: test.title, project: test.project}} />}
          </React.Fragment>
        );
      })}
    </>
  );
}

// =============== Tests Table ===============
function TestsTable() {
  const D = useRun();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [project, setProject] = useState("all");
  const [open, setOpen] = useState(null);
  const [openAttempt, setOpenAttempt] = useState({});

  // Reset open row and filters when switching runs
  useEffect(() => {
    setOpen(null);
    setOpenAttempt({});
    setQuery("");
    setStatus("all");
    setProject("all");
  }, [D]);

  const filtered = useMemo(() => {
    return D.tests.filter(t => {
      if (status !== "all" && t.status !== status) return false;
      if (project !== "all" && t.project !== project) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.file.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [D, query, status, project]);

  const maxDur = useMemo(() => Math.max(...D.tests.map(t => t.duration), 1), [D]);

  return (
    <div className="card">
      <div className="card-h">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="card-title">Tests</div>
          <span className="mono" style={{fontSize:11,color:"var(--muted)"}}>{filtered.length} of {D.tests.length}</span>
        </div>
      </div>
      <Filters query={query} setQuery={setQuery} status={status} setStatus={setStatus} project={project} setProject={setProject}/>
      <div style={{display:"grid",gridTemplateColumns:"28px 1fr 110px 110px 90px 100px 24px",gap:12,padding:"10px 18px",fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--muted)",borderBottom:"1px solid var(--line-soft)"}}>
        <div/><div>Test</div><div>Project</div><div>Retries</div><div>Duration</div><div/><div/>
      </div>
      <div>
        {filtered.slice(0, 80).map(t => (
          <TestRow
            key={t.id}
            test={t}
            maxDur={maxDur}
            open={open === t.id}
            onToggle={() => setOpen(open === t.id ? null : t.id)}
            openAttempt={openAttempt[t.id]}
            onToggleAttempt={(i) => setOpenAttempt(prev => ({...prev, [t.id]: prev[t.id] === i ? null : i}))}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{padding:"40px 18px",textAlign:"center",color:"var(--muted)",fontSize:13}}>no tests match these filters</div>
        )}
        {filtered.length > 80 && (
          <div style={{padding:"14px 18px",textAlign:"center",color:"var(--muted)",fontSize:12}} className="mono">… {filtered.length - 80} more — refine filters to narrow</div>
        )}
      </div>
    </div>
  );
}

// =============== Sidebar ===============
function Sidebar() {
  const D = useRun();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo"><img src={window.LOGO_URL || "assets/logo_ravilesx.png"} alt="ravilesx"/></div>
        <div>
          <div className="brand-name">RavilesX</div>
          <div className="brand-tag">SDET · Dev</div>
        </div>
      </div>

      <nav>
        <div className="nav-section">Run</div>
        <div className="nav-item active"><span style={{display:"flex",alignItems:"center",gap:10}}><Icon.Chart/> Overview</span></div>
        <div className="nav-item"><span style={{display:"flex",alignItems:"center",gap:10}}><Icon.Tests/> Tests</span><span className="count">{D.summary.total}</span></div>
        {D.summary.failed > 0 && <div className="nav-item"><span style={{display:"flex",alignItems:"center",gap:10}}><Icon.X/> Failures</span><span className="count" style={{color:"var(--fail)"}}>{D.summary.failed}</span></div>}
        {D.summary.flaky > 0 && <div className="nav-item"><span style={{display:"flex",alignItems:"center",gap:10}}><Icon.Bolt/> Flaky</span><span className="count" style={{color:"var(--flaky)"}}>{D.summary.flaky}</span></div>}
      </nav>

      {D.suites.length > 0 && (
        <div>
          <div className="nav-section">Suites</div>
          {Array.from(new Set(D.suites.map(s => s.split("/")[0]))).map(g => (
            <div className="nav-item" key={g}>
              <span style={{display:"flex",alignItems:"center",gap:10}}><Icon.Folder/> {g}</span>
              <span className="count">{D.suites.filter(s => s.startsWith(g+"/") || s === g).length}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{marginTop:"auto",padding:"12px",background:"var(--surface)",borderRadius:10,fontSize:11,fontFamily:"var(--font-mono)",color:"var(--muted)",lineHeight:1.7}}>
        <div style={{color:"var(--text-2)",marginBottom:4}}>environment</div>
        <div>node {D.meta.nodeVersion}</div>
        <div>playwright {D.meta.playwrightVersion}</div>
        <div>{D.meta.runner}</div>
      </div>
    </aside>
  );
}

// =============== Recent runs strip (clickable) ===============
function RecentRuns({ runIdx, onSelectRun }) {
  if (GLOBAL_TREND.length < 2) return null;

  const runs = GLOBAL_TREND.slice(-6).reverse();
  // Map trend index (reversed) back to ALL_RUNS index
  const trendLen = GLOBAL_TREND.length;

  return (
    <div className="card" style={{marginBottom:16}}>
      <div className="card-h">
        <div className="card-title">Run history</div>
        <span className="mono" style={{fontSize:11,color:"var(--muted)"}}>click to inspect · last {runs.length}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${runs.length}, 1fr)`,gap:1,background:"var(--line-soft)"}}>
        {runs.map((r, i) => {
          // i=0 is most recent run → ALL_RUNS index = ALL_RUNS.length - 1
          const runArrIdx = ALL_RUNS.length - 1 - i;
          const isSelected = runIdx === runArrIdx;
          const total = r.passed + r.failed + r.flaky;
          const pct = total > 0 ? Math.round((r.passed / total) * 100) : 0;
          const statusColor = r.failed > 5 ? "failed" : r.failed > 0 ? "flaky" : "passed";

          return (
            <div
              key={i}
              className="run-card"
              onClick={() => onSelectRun(runArrIdx)}
              style={{
                borderRadius: 0,
                border: "none",
                background: isSelected ? "var(--accent-2)" : "var(--surface)",
                cursor: "pointer",
                outline: isSelected ? "2px solid var(--accent)" : "none",
                outlineOffset: -2,
              }}
            >
              <div>
                <div className="rid">{r.run}</div>
                <div className="rmsg">{r.ago} · {pct}% pass</div>
              </div>
              <div>
                <div className="rmeta">{r.duration}s</div>
                <div className="rstatus" style={{marginLeft:"auto",background:`var(--${statusColor})`}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============== Tweaks ===============
function Tweaks() {
  const [tweaks, setTweak] = useTweaks({ theme: "dark", accent: "lime" });
  useEffect(() => {
    document.body.classList.toggle("theme-light", tweaks.theme === "light");
    document.body.classList.remove("accent-violet","accent-orange","accent-blue");
    if (tweaks.accent !== "lime") document.body.classList.add("accent-" + tweaks.accent);
  }, [tweaks.theme, tweaks.accent]);
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Theme">
        <TweakRadio label="Mode" value={tweaks.theme} options={[{label:"Dark",value:"dark"},{label:"Light",value:"light"}]} onChange={v => setTweak("theme", v)} />
        <TweakSelect label="Accent" value={tweaks.accent} options={[
          {label:"Neon Lime", value:"lime"},
          {label:"Violet", value:"violet"},
          {label:"Sunset Orange", value:"orange"},
          {label:"Electric Blue", value:"blue"},
        ]} onChange={v => setTweak("accent", v)} />
      </TweakSection>
    </TweaksPanel>
  );
}

// =============== App ===============
function App() {
  const [runIdx, setRunIdx] = useState(ALL_RUNS.length - 1);
  const currentRun = ALL_RUNS[runIdx];

  return (
    <RunContext.Provider value={currentRun}>
      <div className="shell">
        <Sidebar/>
        <main className="main">
          <div className="topbar">
            <div className="run-meta">
              <div className="crumbs">
                RavilesX <span style={{color:"var(--muted)"}}>/</span> <strong>{currentRun.meta.project}</strong> <span style={{color:"var(--muted)"}}>/</span> reports <span style={{color:"var(--muted)"}}>/</span> <strong>{currentRun.meta.runId}</strong>
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {GLOBAL_TREND.length > 1 && <Sparkline values={GLOBAL_TREND.map(t => t.passed)} color="var(--pass)"/>}
              <button className="btn" onClick={() => window.postMessage({ type: '__activate_edit_mode' }, '*')}><Icon.Settings/></button>
            </div>
          </div>

          <Hero/>
          <ChartsRow runIdx={runIdx} onSelectRun={setRunIdx}/>
          <SecondaryRow/>
          <RecentRuns runIdx={runIdx} onSelectRun={setRunIdx} />
          <TestsTable/>

          <div style={{marginTop:32,color:"var(--muted)",fontSize:11,fontFamily:"var(--font-mono)",textAlign:"center"}}>
            built with playwright {currentRun.meta.playwrightVersion} · node {currentRun.meta.nodeVersion} · {currentRun.meta.workers} workers
          </div>
        </main>
        <Tweaks/>
      </div>
    </RunContext.Provider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
