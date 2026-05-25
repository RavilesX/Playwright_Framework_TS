import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

type ReportStatus = 'passed' | 'failed' | 'flaky' | 'skipped';

interface StepInfo {
  title: string;
  duration: number;
  ok: boolean;
}

interface AttachmentInfo {
  name: string;
  contentType: string;
  path: string | null;
  /** Absolute source path on disk; stripped after the file is copied. */
  _src?: string | null;
}

interface AttemptInfo {
  retry: number;
  status: ReportStatus;
  duration: number;
  startedAt: number;
  errorLine: number | null;
  errorMessage: string | null;
  errorStack: string | null;
  steps: StepInfo[];
  attachments: AttachmentInfo[];
  stdout: string[];
  stderr: string[];
}

interface TestRecord {
  id: string;
  testKey: string;
  title: string;
  file: string;
  project: string;
  status: ReportStatus;
  retries: number;
  duration: number;
  startedAt: number;
  errorLine: number | null;
  errorMessage: string | null;
  errorStack: string | null;
  steps: StepInfo[];
  attachments: AttachmentInfo[];
  stdout: string[];
  stderr: string[];
  attempts?: AttemptInfo[];
}

interface RunSummary {
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  duration: number;
  passRate: number;
}

interface RunMeta {
  project: string;
  branch: string;
  commit: string;
  commitMsg: string;
  author: string;
  runId: string;
  startedAt: string;
  runner: string;
  shards: string;
  workers: number;
  ci: string;
  playwrightVersion: string;
  nodeVersion: string;
}

interface ReportRun {
  meta: RunMeta;
  summary: RunSummary;
  projects: string[];
  suites: string[];
  tests: TestRecord[];
  slowest: TestRecord[];
}

interface TrendPoint {
  run: string;
  passed: number;
  failed: number;
  flaky: number;
  duration: number;
  ago: string;
  startedAt: number;
}

interface ReportHistory {
  runs: ReportRun[];
  trend: TrendPoint[];
}

interface ReporterOptions {
  outputDir?: string;
  historyFile?: string;
}

export default class CustomHtmlReporter implements Reporter {
  private outputDir: string;
  private historyFile: string;
  private tests: TestRecord[] = [];
  private projects = new Set<string>();
  private suites = new Set<string>();
  private idCounter = 0;
  private config: FullConfig | null = null;
  private startedAt: Date | null = null;

  constructor(options: ReporterOptions = {}) {
    this.outputDir = options.outputDir || 'playwright-report';
    this.historyFile = options.historyFile || '.playwright-report-history.json';
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.startedAt = new Date();
    this.config = config;

    suite.allTests().forEach((t) => {
      const proj = t.parent.project()?.name;
      if (proj) this.projects.add(proj);
      const file = this._relFile(t.location.file, config);
      if (file) this.suites.add(file);
    });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const testId = 't' + ++this.idCounter;
    const file = this._relFile(test.location.file, this.config);
    const project = test.parent.project()?.name ?? 'default';

    this.projects.add(project);
    if (file) this.suites.add(file);

    const steps: StepInfo[] = (result.steps || []).map((s) => ({
      title: s.title,
      duration: s.duration,
      ok: !s.error,
    }));

    const attachments: AttachmentInfo[] = (result.attachments || []).map((a) => {
      const srcPath = a.path && fs.existsSync(a.path) ? a.path : null;
      const filename = srcPath ? path.basename(srcPath) : a.name || 'attachment';
      const relPath = srcPath ? `attachments/${testId}/${filename}` : null;
      return { name: a.name, contentType: a.contentType || '', path: relPath, _src: srcPath };
    });

    const stdout = (result.stdout || []).map((b) =>
      this._stripAnsi(typeof b === 'string' ? b : b.toString('utf8'))
    );
    const stderr = (result.stderr || []).map((b) =>
      this._stripAnsi(typeof b === 'string' ? b : b.toString('utf8'))
    );

    const testKey = test.id || test.titlePath().join('>') + '|' + project;

    this.tests.push({
      id: testId,
      testKey,
      title: test.title,
      file,
      project,
      status: this._mapStatus(test, result),
      retries: result.retry || 0,
      duration: result.duration || 0,
      startedAt: result.startTime?.getTime() ?? Date.now(),
      errorLine: result.error?.location?.line ?? null,
      errorMessage: this._stripAnsiOrNull(result.error?.message),
      errorStack: this._stripAnsiOrNull(result.error?.stack),
      steps,
      attachments,
      stdout,
      stderr,
    });
  }

  private _stripAnsi(s: string): string {
    return s.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
  }

  private _stripAnsiOrNull(s: string | null | undefined): string | null {
    return s == null ? null : this._stripAnsi(s);
  }

  private _groupAttempts(rows: TestRecord[]): TestRecord[] {
    const groups = new Map<string, TestRecord[]>();
    for (const t of rows) {
      const key = t.testKey || t.id;
      const list = groups.get(key);
      if (list) list.push(t);
      else groups.set(key, [t]);
    }
    const grouped: TestRecord[] = [];
    for (const items of groups.values()) {
      items.sort((a, b) => (a.retries || 0) - (b.retries || 0));
      const parent = items[items.length - 1]!;
      parent.attempts = items.slice(0, -1).map((a) => ({
        retry: a.retries,
        status: a.status,
        duration: a.duration,
        startedAt: a.startedAt,
        errorLine: a.errorLine,
        errorMessage: a.errorMessage,
        errorStack: a.errorStack,
        steps: a.steps,
        attachments: a.attachments,
        stdout: a.stdout,
        stderr: a.stderr,
      }));
      grouped.push(parent);
    }
    grouped.sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0));
    return grouped;
  }

  async onEnd(): Promise<void> {
    if (this.tests.length === 0) return;
    this.tests = this._groupAttempts(this.tests);
    const total = this.tests.length;
    const passed = this.tests.filter((t) => t.status === 'passed').length;
    const failed = this.tests.filter((t) => t.status === 'failed').length;
    const flaky = this.tests.filter((t) => t.status === 'flaky').length;
    const skipped = this.tests.filter((t) => t.status === 'skipped').length;
    const totalDuration = this.tests.reduce((a, b) => a + (b.duration || 0), 0);
    const passRate = total > 0 ? Math.round((passed / total) * 1000) / 10 : 0;

    const slowest = [...this.tests].sort((a, b) => b.duration - a.duration).slice(0, 6);

    const history = this._loadHistory();
    const runId = `#${this._nextRunNumber(history)}`;
    const meta = this._buildMeta(runId);

    const currentRun: ReportRun = {
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
      startedAt: this.startedAt!.getTime(),
    });

    if (history.runs.length > 14) history.runs.splice(0, history.runs.length - 14);
    if (history.trend.length > 14) history.trend.splice(0, history.trend.length - 14);

    this._recalcAgo(history.trend);

    this._prepareOutputDir();
    this._copyTemplate();
    this._copyTraceViewer();
    this._writeAttachments();

    // Strip attachment paths from archived (non-current) runs so broken paths aren't shown
    history.runs.slice(0, -1).forEach((run) => {
      run.tests.forEach((t) => {
        t.attachments = (t.attachments || []).map((a) => ({
          name: a.name,
          contentType: a.contentType,
          path: null,
        }));
        (t.attempts || []).forEach((att) => {
          att.attachments = (att.attachments || []).map((a) => ({
            name: a.name,
            contentType: a.contentType,
            path: null,
          }));
        });
      });
    });

    this._saveHistory(history);

    const reportData = {
      trend: history.trend,
      runs: history.runs,
    };

    const dataJs = 'window.REPORT_DATA = ' + JSON.stringify(reportData, null, 2) + ';\n';
    fs.writeFileSync(path.join(this.outputDir, 'data.js'), dataJs, 'utf8');

    const reportPath = path.resolve(this.outputDir, 'index.html');
    const fileUrl = 'file://' + reportPath;
    const OSC = '\x1B]8;;';
    const ST = '\x07';
    const hyperlink = `${OSC}${fileUrl}${ST}npx playwright show-report${OSC}${ST}`;
    console.log(`\n✓ Custom report: ${reportPath}`);
    console.log('\nTo open last HTML report run:\n');
    console.log(`  ${hyperlink}\n`);
    console.log('  (Trace viewer requires HTTP — use `npx playwright show-report`, not file://)\n');
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private _mapStatus(test: TestCase, result: TestResult): ReportStatus {
    if (result.status === 'skipped') return 'skipped';
    try {
      if (test.outcome() === 'flaky') return 'flaky';
    } catch {}
    if (result.status === 'passed') return 'passed';
    return 'failed';
  }

  private _relFile(absFile: string, config: FullConfig | null): string {
    if (!absFile) return '';
    const base = config?.rootDir || process.cwd();
    return absFile.startsWith(base) ? absFile.slice(base.length).replace(/^\//, '') : absFile;
  }

  private _writeAttachments(): void {
    const writeList = (atts: AttachmentInfo[] | undefined): void => {
      (atts || []).forEach((a) => {
        if (!a._src || !a.path) {
          delete a._src;
          return;
        }
        const dest = path.join(this.outputDir, a.path);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        try {
          fs.copyFileSync(a._src, dest);
        } catch {}
        delete a._src;
      });
    };
    this.tests.forEach((t) => {
      writeList(t.attachments);
      (t.attempts || []).forEach((att) => writeList(att.attachments));
    });
  }

  private _nextRunNumber(history: ReportHistory): number {
    const ids = [
      ...(history.runs || []).map((r) => r.meta?.runId),
      ...(history.trend || []).map((r) => r.run),
    ]
      .filter((s): s is string => Boolean(s))
      .map((s) => parseInt(s.replace(/^#/, ''), 10))
      .filter((n) => !isNaN(n));
    return (ids.length ? Math.max(...ids) : 0) + 1;
  }

  private _loadHistory(): ReportHistory {
    try {
      if (fs.existsSync(this.historyFile)) {
        const parsed = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
        // Validate new format (has .runs and .trend arrays)
        if (parsed && Array.isArray(parsed.runs) && Array.isArray(parsed.trend)) {
          return parsed as ReportHistory;
        }
      }
    } catch {}
    return { runs: [], trend: [] };
  }

  private _saveHistory(history: ReportHistory): void {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2), 'utf8');
    } catch {}
  }

  private _recalcAgo(trend: TrendPoint[]): void {
    const now = Date.now();
    trend.forEach((r, i) => {
      if (i === trend.length - 1) {
        r.ago = 'now';
        return;
      }
      if (!r.startedAt) {
        r.ago = '—';
        return;
      }
      const diffMs = now - r.startedAt;
      const diffH = Math.round(diffMs / 3600000);
      const diffM = Math.round(diffMs / 60000);
      r.ago = diffH >= 1 ? `${diffH}h ago` : `${diffM}m ago`;
    });
  }

  private _buildMeta(runId: string): RunMeta {
    let branch = 'unknown',
      commit = '?',
      commitMsg = '',
      author = '';
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch {}
    try {
      commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {}
    try {
      commitMsg = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
    } catch {}
    try {
      author = execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim();
    } catch {}

    let playwrightVersion = '?';
    try {
      const pwPkg = require(path.join(process.cwd(), 'node_modules/@playwright/test/package.json'));
      playwrightVersion = pwPkg.version;
    } catch {}

    const ci = process.env.GITHUB_ACTIONS
      ? 'GitHub Actions'
      : process.env.GITLAB_CI
        ? 'GitLab CI'
        : process.env.CIRCLECI
          ? 'CircleCI'
          : process.env.CI
            ? 'CI'
            : 'local';

    return {
      project: path.basename(process.cwd()),
      branch,
      commit,
      commitMsg: commitMsg || `run ${runId}`,
      author: author || os.userInfo().username,
      runId,
      startedAt: this.startedAt!.toISOString().replace('T', ' ').slice(0, 19),
      runner: `${os.platform()} ${os.release()}`,
      shards: '1 / 1',
      workers: this.config?.workers ?? 1,
      ci,
      playwrightVersion,
      nodeVersion: process.version,
    };
  }

  private _prepareOutputDir(): void {
    if (fs.existsSync(this.outputDir)) {
      fs.rmSync(this.outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.outputDir, { recursive: true });
  }

  private _copyTemplate(): void {
    const templateDir = path.join(__dirname, 'template');
    fs.cpSync(templateDir, this.outputDir, { recursive: true });
  }

  private _copyTraceViewer(): void {
    try {
      const pwCorePath = require.resolve('playwright-core');
      const tvSrc = path.join(path.dirname(pwCorePath), 'lib/vite/traceViewer');
      if (fs.existsSync(tvSrc)) {
        fs.cpSync(tvSrc, path.join(this.outputDir, 'trace'), { recursive: true });
      } else {
        console.warn('[CustomHtmlReporter] trace viewer not found at:', tvSrc);
      }
    } catch (e) {
      console.warn(
        '[CustomHtmlReporter] could not copy trace viewer:',
        e instanceof Error ? e.message : e
      );
    }
  }
}
