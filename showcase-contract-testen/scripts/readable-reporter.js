const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const readApiInfo = (baseDir, relativeSpecPath) => {
  try {
    const fullPath = path.resolve(baseDir, relativeSpecPath);
    const spec = yaml.load(fs.readFileSync(fullPath, 'utf8'));
    const title = spec && spec.info && spec.info.title ? String(spec.info.title) : 'Onbekende API';
    const version = spec && spec.info && spec.info.version ? String(spec.info.version) : 'onbekend';
    const endpoint = spec && spec.paths ? String(Object.keys(spec.paths)[0] || 'onbekend') : 'onbekend';
    return { title, version, endpoint };
  } catch {
    return { title: 'Onbekende API', version: 'onbekend', endpoint: 'onbekend' };
  }
};

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

class ReadableContractReporter {
  constructor(options) {
    this.options = options || {};
    this.testResults = new Map();
    this.startTime = 0;
    this.baseDir = this.options.baseDir
      ? path.resolve(this.options.baseDir)
      : path.resolve(__dirname, '..');
    this.onlyPath = this.options.onlyPath
      ? path.resolve(this.baseDir, this.options.onlyPath)
      : null;
    this.consumerApiInfo = null;
    this.providerApiInfo = null;
  }

  onBegin() {
    this.startTime = Date.now();
    this.consumerApiInfo = readApiInfo(this.baseDir, 'scheepsregister/openapi.yaml');
    this.providerApiInfo = readApiInfo(this.baseDir, 'deelsysteem/openapi.yaml');
    console.log('[contract] Start tests...');
  }

  onTestEnd(test, result) {
    const titlePath = typeof test.titlePath === 'function' ? test.titlePath() : [];
    const specTitle = titlePath.slice(0, -1).filter(Boolean).join(' > ');
    const status = (result.status || 'unknown').toUpperCase();
    const testFile = test.location && test.location.file ? test.location.file : '';

    if (this.onlyPath) {
      const normalizedFile = path.normalize(testFile).toLowerCase();
      const normalizedOnly = path.normalize(this.onlyPath).toLowerCase();
      if (!normalizedFile.startsWith(normalizedOnly)) {
        return;
      }
    }

    this.testResults.set(test.id, {
      file: testFile,
      specTitle,
      testTitle: (test.title || '').trim(),
      status,
      durationMs: Number(result.duration || 0),
      errorMessage: result.error ? result.error.message : '',
    });
  }

  onEnd(result) {
    const outputFile = this.options.outputFile
      ? path.resolve(this.baseDir, this.options.outputFile)
      : path.join(this.baseDir, 'test-results', 'contract-report.txt');

    const tests = Array.from(this.testResults.values());
    const consumer = tests.filter((t) => /consumer/i.test(t.file) || /consumer/i.test(t.specTitle));
    const provider = tests.filter((t) => /provider/i.test(t.file) || /provider/i.test(t.specTitle));

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let flaky = 0;

    for (const t of tests) {
      if (t.status === 'PASSED') passed += 1;
      else if (t.status === 'SKIPPED') skipped += 1;
      else if (t.status === 'FLAKY') flaky += 1;
      else failed += 1;
    }

    const durationMs = result && typeof result.duration === 'number'
      ? result.duration
      : Date.now() - this.startTime;

    const summary = [
      '========================',
      'Samenvatting Contracttests',
      '========================',
      `Totaal: ${tests.length}`,
      `Geslaagd: ${passed}`,
      `Gefaald: ${failed}`,
      `Skipped: ${skipped}`,
      `Flaky: ${flaky}`,
      `Duur: ${Number(durationMs || 0)} ms`,
      '',
    ];

    const now = new Date();
    const formatted = new Intl.DateTimeFormat('nl-NL', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(now);
    const header = [
      'Showcase-contract-testen',
      `Uitvoer: ${formatted}`,
      '',
    ];

    const finalText = [
      ...header,
      ...formatSection('Consumer', consumer, this.consumerApiInfo),
      ...formatSection('Provider', provider, this.providerApiInfo),
      ...summary,
    ].join('\n');

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, finalText, 'utf8');

    const relative = path.relative(this.baseDir, outputFile) || outputFile;
    console.log(`[contract] Rapport: ${relative}`);
  }
}

module.exports = ReadableContractReporter;
