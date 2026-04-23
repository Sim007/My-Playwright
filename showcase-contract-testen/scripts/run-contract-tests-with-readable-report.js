const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const yaml = require('js-yaml');

const reportDir = path.resolve(__dirname, '..', 'test-results');
const reportFile = path.join(reportDir, 'contract-report.txt');
const workspaceRoot = path.resolve(__dirname, '..', '..');
const playwrightCli = path.join(workspaceRoot, 'node_modules', '@playwright', 'test', 'cli.js');

const readApiInfo = (relativeSpecPath) => {
  try {
    const fullPath = path.resolve(__dirname, '..', relativeSpecPath);
    const spec = yaml.load(fs.readFileSync(fullPath, 'utf8'));
    const title = spec && spec.info && spec.info.title ? String(spec.info.title) : 'Onbekende API';
    const version = spec && spec.info && spec.info.version ? String(spec.info.version) : 'onbekend';
    const endpoint = spec && spec.paths ? String(Object.keys(spec.paths)[0] || 'onbekend') : 'onbekend';
    return { title, version, endpoint };
  } catch {
    return { title: 'Onbekende API', version: 'onbekend', endpoint: 'onbekend' };
  }
};

const consumerApiInfo = readApiInfo('scheepsregister/openapi.yaml');
const providerApiInfo = readApiInfo('deelsysteem/openapi.yaml');

fs.mkdirSync(reportDir, { recursive: true });
console.log('[contract] Start tests...');

const result = spawnSync(
  process.execPath,
  [playwrightCli, 'test', '--config', 'playwright.config.ts', '--reporter=json'],
  {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  },
);

const parseJsonReport = (text) => {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(trimmed.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const flattenTests = (node, items = []) => {
  if (!node) return items;

  if (Array.isArray(node.suites)) {
    for (const suite of node.suites) flattenTests(suite, items);
  }

  if (Array.isArray(node.specs)) {
    for (const spec of node.specs) {
      const file = spec.file || '';
      const specTitle = spec.title || '';
      const tests = Array.isArray(spec.tests) ? spec.tests : [];
      for (const test of tests) {
        const results = Array.isArray(test.results) ? test.results : [];
        const firstResult = results[0] || {};
        items.push({
          file,
          specTitle,
          testTitle: (test.title || '').trim(),
          status: (test.status || firstResult.status || 'unknown').toUpperCase(),
          durationMs: Number(firstResult.duration || 0),
          errorMessage: firstResult.error ? firstResult.error.message : '',
        });
      }
    }
  }

  return items;
};

const report = parseJsonReport(result.stdout || '');
const tests = report ? flattenTests(report) : [];

const consumer = tests.filter((t) => /consumer/i.test(t.file) || /consumer/i.test(t.specTitle));
const provider = tests.filter((t) => /provider/i.test(t.file) || /provider/i.test(t.specTitle));

const formatSection = (title, rows, apiInfo) => {
  const lines = [title, '-'.repeat(title.length)];
  if (apiInfo) {
    lines.push(`API: ${apiInfo.title}`);
    lines.push(`Endpoint: ${apiInfo.endpoint}`);
    lines.push(`Versie: V${apiInfo.version}`);
    lines.push('');
  }
  if (!rows.length) {
    lines.push('Geen tests gevonden.');
    lines.push('');
    return lines;
  }

  for (const t of rows) {
    lines.push(`- [${t.status}] ${t.testTitle || t.specTitle} (${t.durationMs} ms)`);
    if (t.errorMessage) lines.push(`  Fout: ${t.errorMessage}`);
  }
  lines.push('');
  return lines;
};

const stats = report && report.stats ? report.stats : {};
const summary = [
  '========================',
  'Samenvatting Contracttests',
  '========================',
  `Totaal: ${Number(stats.expected || 0) + Number(stats.unexpected || 0) + Number(stats.flaky || 0) + Number(stats.skipped || 0)}`,
  `Geslaagd: ${Number(stats.expected || 0)}`,
  `Gefaald: ${Number(stats.unexpected || 0)}`,
  `Skipped: ${Number(stats.skipped || 0)}`,
  `Flaky: ${Number(stats.flaky || 0)}`,
  `Duur: ${Number(stats.duration || 0)} ms`,
  '',
];

const formatted = new Intl.DateTimeFormat('nl-NL', {
  dateStyle: 'short',
  timeStyle: 'medium',
}).format(new Date());

const header = [
  'Showcase-contract-testen',
  `Uitvoer: ${formatted}`,
  '',
];

const fallbackOutput = `${result.stdout || ''}${result.stderr || ''}`.trim();
let finalText = [
  ...header,
  ...formatSection('Consumer', consumer, consumerApiInfo),
  ...formatSection('Provider', provider, providerApiInfo),
  ...summary,
].join('\n');

if (!report) {
  finalText = [
    ...header,
    'Kon JSON rapport niet parsen. Ruwe uitvoer:',
    '----------------------------------------',
    fallbackOutput || '(geen output)',
    '',
    ...summary,
  ].join('\n');
}

fs.writeFileSync(reportFile, finalText, 'utf8');
console.log('[contract] Rapport: test-results/contract-report.txt');

process.exit(result.status === null ? 1 : result.status);
