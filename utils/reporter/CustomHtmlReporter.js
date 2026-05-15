const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

class CustomHtmlReporter {
  constructor(options = {}) {
    this.outputDir = options.outputDir || 'playwright-report';
    this.historyFile = options.historyFile || '.playwright-report-history.json';
    this.tests = [];
    this.projects = new Set();
    this.suites = new Set();
    this.idCounter = 0;
    this.config = null;
    this.startedAt = null;
  }

  onBegin(config, suite) {
    this.startedAt = new Date();
    this.config = config;

    suite.allTests().forEach(t => {
      const proj = t.parent && t.parent.project && t.parent.project() && t.parent.project().name;
      if (proj) this.projects.add(proj);
      const file = this._relFile(t.location && t.location.file || '', config);
      if (file) this.suites.add(file);
    });
  }

  onTestEnd(test, result) {
    const testId = 't' + (++this.idCounter);
    const file = this._relFile(test.location && test.location.file || '', this.config);
    const project = test.parent && test.parent.project && test.parent.project() && test.parent.project().name || 'default';

    this.projects.add(project);
    if (file) this.suites.add(file);

    const steps = (result.steps || []).map(s => ({
      title: s.title,
      duration: s.duration,
      ok: !s.error,
    }));

    const attachments = (result.attachments || []).map(a => {
      const relPath = this._copyAttachment(a, testId);
      return { name: a.name, contentType: a.contentType || '', path: relPath };
    });

    const stdout = (result.stdout || []).map(b =>
      typeof b === 'string' ? b : b.toString('utf8')
    );
    const stderr = (result.stderr || []).map(b =>
      typeof b === 'string' ? b : b.toString('utf8')
    );

    this.tests.push({
      id: testId,
      title: test.title,
      file,
      project,
      status: this._mapStatus(test, result),
      retries: result.retry || 0,
      duration: result.duration || 0,
      startedAt: result.startTime && result.startTime.getTime() || Date.now(),
      errorLine: result.error && result.error.location && result.error.location.line || null,
      errorMessage: result.error && result.error.message || null,
      errorStack: result.error && result.error.stack || null,
      steps,
      attachments,
      stdout,
      stderr,
    });
  }

  async onEnd() {
    const total = this.tests.length;
    const passed = this.tests.filter(t => t.status === 'passed').length;
    const failed = this.tests.filter(t => t.status === 'failed').length;
    const flaky = this.tests.filter(t => t.status === 'flaky').length;
    const skipped = this.tests.filter(t => t.status === 'skipped').length;
    const totalDuration = this.tests.reduce((a, b) => a + (b.duration || 0), 0);
    const passRate = total > 0 ? Math.round((passed / total) * 1000) / 10 : 0;

    const slowest = [...this.tests]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 6);

    const history = this._loadHistory();
    const runId = `#${history.runs.length + 1}`;
    const meta = this._buildMeta(runId);

    const currentRun = {
      meta,
      summary: { total, passed, failed, flaky, skipped, duration: totalDuration, passRate },
      projects: [...this.projects],
      suites: [...this.suites],
      tests: this.tests,
      slowest,
    };

    history.runs.push(currentRun);
    history.trend.push({
      run: runId,
      passed,
      failed,
      flaky,
      duration: Math.round(totalDuration / 1000),
      ago: 'now',
      startedAt: this.startedAt.getTime(),
    });

    if (history.runs.length > 14) history.runs.splice(0, history.runs.length - 14);
    if (history.trend.length > 14) history.trend.splice(0, history.trend.length - 14);

    this._recalcAgo(history.trend);

    // Strip attachment paths from archived (non-current) runs so broken paths aren't shown
    history.runs.slice(0, -1).forEach(run => {
      run.tests.forEach(t => {
        t.attachments = (t.attachments || []).map(a => ({ ...a, path: null }));
      });
    });

    this._saveHistory(history);

    this._prepareOutputDir();
    this._copyTemplate();
    this._copyTraceViewer();

    const reportData = {
      trend: history.trend,
      runs: history.runs,
    };

    const dataJs = 'window.REPORT_DATA = ' + JSON.stringify(reportData, null, 2) + ';\n';
    fs.writeFileSync(path.join(this.outputDir, 'data.js'), dataJs, 'utf8');

    const reportPath = path.resolve(this.outputDir, 'index.html');
    console.log(`\n✓ Custom report: ${reportPath}`);
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  _mapStatus(test, result) {
    if (result.status === 'skipped') return 'skipped';
    try {
      if (test.outcome() === 'flaky') return 'flaky';
    } catch (_) {}
    if (result.status === 'passed') return 'passed';
    return 'failed';
  }

  _relFile(absFile, config) {
    if (!absFile) return '';
    const base = config && config.rootDir || process.cwd();
    return absFile.startsWith(base) ? absFile.slice(base.length).replace(/^\//, '') : absFile;
  }

  _copyAttachment(attachment, testId) {
    if (!attachment.path || !fs.existsSync(attachment.path)) return null;
    const destDir = path.join(this.outputDir, 'attachments', testId);
    fs.mkdirSync(destDir, { recursive: true });
    const filename = path.basename(attachment.path);
    const dest = path.join(destDir, filename);
    fs.copyFileSync(attachment.path, dest);
    return `attachments/${testId}/${filename}`;
  }

  _loadHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        const parsed = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
        // Validate new format (has .runs and .trend arrays)
        if (parsed && Array.isArray(parsed.runs) && Array.isArray(parsed.trend)) {
          return parsed;
        }
      }
    } catch (_) {}
    return { runs: [], trend: [] };
  }

  _saveHistory(history) {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2), 'utf8');
    } catch (_) {}
  }

  _recalcAgo(trend) {
    const now = Date.now();
    trend.forEach((r, i) => {
      if (i === trend.length - 1) { r.ago = 'now'; return; }
      if (!r.startedAt) { r.ago = '—'; return; }
      const diffMs = now - r.startedAt;
      const diffH = Math.round(diffMs / 3600000);
      const diffM = Math.round(diffMs / 60000);
      r.ago = diffH >= 1 ? `${diffH}h ago` : `${diffM}m ago`;
    });
  }

  _buildMeta(runId) {
    let branch = 'unknown', commit = '?', commitMsg = '', author = '';
    try { branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(); } catch (_) {}
    try { commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch (_) {}
    try { commitMsg = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim(); } catch (_) {}
    try { author = execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim(); } catch (_) {}

    let playwrightVersion = '?';
    try {
      const pwPkg = require(path.join(process.cwd(), 'node_modules/@playwright/test/package.json'));
      playwrightVersion = pwPkg.version;
    } catch (_) {}

    const ci = process.env.GITHUB_ACTIONS ? 'GitHub Actions'
      : process.env.GITLAB_CI ? 'GitLab CI'
      : process.env.CIRCLECI ? 'CircleCI'
      : process.env.CI ? 'CI'
      : 'local';

    return {
      project: path.basename(process.cwd()),
      branch,
      commit,
      commitMsg: commitMsg || `run ${runId}`,
      author: author || os.userInfo().username,
      runId,
      startedAt: this.startedAt.toISOString().replace('T', ' ').slice(0, 19),
      runner: `${os.platform()} ${os.release()}`,
      shards: '1 / 1',
      workers: this.config && this.config.workers || 1,
      ci,
      playwrightVersion,
      nodeVersion: process.version,
    };
  }

  _prepareOutputDir() {
    if (fs.existsSync(this.outputDir)) {
      fs.rmSync(this.outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.outputDir, { recursive: true });
  }

  _copyTemplate() {
    const templateDir = path.join(__dirname, 'template');
    fs.cpSync(templateDir, this.outputDir, { recursive: true });
  }

  _copyTraceViewer() {
    try {
      const pwCorePath = require.resolve('playwright-core');
      const tvSrc = path.join(path.dirname(pwCorePath), 'lib/vite/traceViewer');
      if (fs.existsSync(tvSrc)) {
        fs.cpSync(tvSrc, path.join(this.outputDir, 'trace'), { recursive: true });
      } else {
        console.warn('[CustomHtmlReporter] trace viewer not found at:', tvSrc);
      }
    } catch (e) {
      console.warn('[CustomHtmlReporter] could not copy trace viewer:', e.message);
    }
  }
}

module.exports = CustomHtmlReporter;
