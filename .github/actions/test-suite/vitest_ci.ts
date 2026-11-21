// Resolves Vitest arguments for the test-suite action, then summarizes its run. Port of mightymodels' pytest_ci.py.

import { randomInt } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';

type ProblemKind = 'failure' | 'error';

interface AssertionResult {
    readonly fullName: string;
    readonly status: string;
    readonly failureMessages: readonly string[];
}

interface FileResult {
    readonly name: string;
    readonly status: string;
    readonly message: string;
    readonly endTime: number;
    readonly assertionResults: readonly AssertionResult[];
}

interface JsonReport {
    readonly numPassedTests: number;
    readonly numFailedTests: number;
    readonly numPendingTests: number;
    readonly numTodoTests: number;
    readonly startTime: number;
    readonly testResults: readonly FileResult[];
}

interface CoverageMetric {
    readonly pct: number | string;
}

interface CoverageEntry {
    readonly lines: CoverageMetric;
    readonly statements: CoverageMetric;
    readonly functions: CoverageMetric;
    readonly branches: CoverageMetric;
}

type CoverageSummary = Readonly<Record<string, CoverageEntry>>;

interface Problem {
    readonly kind: ProblemKind;
    readonly testId: string;
    readonly details: string;
}

interface SuiteTotals {
    readonly passed: number;
    readonly failures: number;
    readonly errors: number;
    readonly skipped: number;
    readonly todo: number;
    readonly seconds: number;
}

interface SummaryContext {
    readonly project: string;
    readonly randomSeed: string;
    readonly workers: string;
    readonly nodeVersion: string;
}

const DETAILED_PROBLEMS = 20;
const LISTED_PROBLEMS = 100;
const TRACEBACK_CHARACTERS = 4000;
const MINIMUM_FENCE_LENGTH = 3;
const SEED_LIMIT = 2 ** 32;

function writeStepOutputs(outputs: Readonly<Record<string, string>>): void {
    const outputFile = process.env.GITHUB_OUTPUT;
    if (!outputFile) {
        return;
    }
    const lines = Object.entries(outputs).map(
        ([name, value]) => `${name}=${value}\n`,
    );
    appendFileSync(outputFile, lines.join(''));
}

function splitVitestArguments(value: string): string[] {
    return value
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

function chooseRandomSeed(requested: string): string {
    return requested || String(randomInt(SEED_LIMIT));
}

function resolveVitestRun(argv: readonly string[]): number {
    const { values } = parseArgs({
        args: [...argv],
        options: {
            'results-dir': { type: 'string' },
            project: { type: 'string' },
            workers: { type: 'string', default: '' },
            'random-seed': { type: 'string', default: '' },
            coverage: { type: 'string', default: 'true' },
            'vitest-args': { type: 'string', default: '' },
        },
    });
    const resultsDir = values['results-dir'];
    const project = values.project;
    if (!resultsDir || !project) {
        throw new Error('resolve needs --results-dir and --project');
    }

    const randomSeed = chooseRandomSeed(values['random-seed']);
    const jsonReport = join(resultsDir, 'report.json');
    const coverageDir = join(resultsDir, 'coverage');
    const withCoverage = values.coverage === 'true';
    const workers = values.workers === 'auto' ? '' : values.workers;

    writeStepOutputs({
        'random-seed': randomSeed,
        'json-report': jsonReport,
        'coverage-html': withCoverage ? coverageDir : '',
        'coverage-summary': withCoverage
            ? join(coverageDir, 'coverage-summary.json')
            : '',
    });

    const vitestArguments = [
        '--project',
        project,
        '--sequence.shuffle',
        `--sequence.seed=${randomSeed}`,
        '--reporter=default',
        '--reporter=github-actions',
        '--reporter=json',
        `--outputFile.json=${jsonReport}`,
        ...(workers ? [`--maxWorkers=${workers}`] : []),
        ...(withCoverage
            ? ['--coverage', `--coverage.reportsDirectory=${coverageDir}`]
            : []),
        ...splitVitestArguments(values['vitest-args']),
    ];
    process.stdout.write(
        vitestArguments.map((argument) => `${argument}\0`).join(''),
    );
    return 0;
}

function readJson(path: string): unknown {
    return JSON.parse(readFileSync(path, 'utf8'));
}

function readFileProblems(file: FileResult): Problem[] {
    const testFile = relative(process.cwd(), file.name);
    const failures = file.assertionResults
        .filter((assertion) => assertion.status === 'failed')
        .map((assertion): Problem => ({
            kind: 'failure',
            testId: `${testFile} > ${assertion.fullName}`,
            details: assertion.failureMessages.join('\n'),
        }));
    if (file.status === 'failed' && failures.length === 0) {
        return [{ kind: 'error', testId: testFile, details: file.message }];
    }
    return failures;
}

function readTotals(
    report: JsonReport,
    problems: readonly Problem[],
): SuiteTotals {
    const endTimes = report.testResults.map((file) => file.endTime);
    const finishedAt = Math.max(report.startTime, ...endTimes);
    return {
        passed: report.numPassedTests,
        failures: report.numFailedTests,
        errors: problems.filter((problem) => problem.kind === 'error').length,
        skipped: report.numPendingTests,
        todo: report.numTodoTests,
        seconds: (finishedAt - report.startTime) / 1000,
    };
}

function readVitestVersion(): string {
    const manifest = readJson(
        join(process.cwd(), 'node_modules', 'vitest', 'package.json'),
    ) as { readonly version: string };
    return manifest.version;
}

function escapeHtml(text: string): string {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

function codeFenceFor(text: string): string {
    const runs = text.match(/`+/g) ?? [];
    const longest = Math.max(0, ...runs.map((run) => run.length));
    return '`'.repeat(Math.max(MINIMUM_FENCE_LENGTH, longest + 1));
}

function truncateTraceback(details: string): string {
    if (details.length <= TRACEBACK_CHARACTERS) {
        return details;
    }
    const tail = details.slice(-TRACEBACK_CHARACTERS);
    return `(last ${String(TRACEBACK_CHARACTERS)} of ${String(details.length)} characters)\n${tail}`;
}

function formatPercent(metric: CoverageMetric): string {
    return typeof metric.pct === 'number' ? `${metric.pct.toFixed(1)}%` : '—';
}

function renderOverview(
    totals: SuiteTotals,
    context: SummaryContext,
    coverage: CoverageSummary | undefined,
): string {
    const { project, randomSeed: seed } = context;
    const succeeded = totals.failures + totals.errors === 0;
    const headline = succeeded
        ? `## :white_check_mark: Vitest ${project} tier passed ${String(totals.passed)} tests`
        : `## :x: Vitest ${project} tier: ${String(totals.failures)} failed, ${String(totals.errors)} errored`;
    const cells = [
        totals.passed,
        totals.failures,
        totals.errors,
        totals.skipped,
        totals.todo,
    ].map((cell) => String(cell));
    const coverageTotal = coverage?.total;
    const coverageLine = coverageTotal
        ? `- **Coverage** ${formatPercent(coverageTotal.lines)} of lines`
        : '- **Coverage** not recorded';

    return [
        headline,
        '',
        '| Passed | Failed | Errors | Skipped | Todo | Duration |',
        '| -----: | -----: | -----: | ------: | ---: | -------: |',
        `| ${cells.join(' | ')} | ${totals.seconds.toFixed(2)}s |`,
        '',
        `- **Node** ${context.nodeVersion}, **Vitest** ${readVitestVersion()}`,
        `- **Workers** ${context.workers || 'Vitest default'}`,
        `- **Random seed** ${seed}, reproduce with \`bun run vitest run --project ${project} --sequence.shuffle --sequence.seed=${seed}\``,
        coverageLine,
    ].join('\n');
}

function renderProblem(problem: Problem): string {
    const details = truncateTraceback(problem.details);
    const fence = codeFenceFor(details);
    const headline = escapeHtml(details.split('\n', 1)[0] ?? '');
    const summary = `<code>${escapeHtml(problem.testId)}</code> ${problem.kind}: ${headline}`;
    return [
        `<details><summary>${summary}</summary>`,
        '',
        `${fence}text`,
        details,
        fence,
        '',
        '</details>',
    ].join('\n');
}

function renderUnlisted(problems: readonly Problem[]): string {
    const shown = problems.slice(0, LISTED_PROBLEMS);
    const hidden = problems.length - shown.length;
    const lines = [
        `${String(problems.length)} more without tracebacks:`,
        '',
        ...shown.map((problem) => `- \`${problem.testId}\` ${problem.kind}`),
    ];
    if (hidden > 0) {
        lines.push(`- and ${String(hidden)} more, see the job log`);
    }
    return lines.join('\n');
}

function renderProblems(problems: readonly Problem[]): string {
    if (problems.length === 0) {
        return '';
    }
    const detailed = problems.slice(0, DETAILED_PROBLEMS);
    const unlisted = problems.slice(DETAILED_PROBLEMS);
    const sections = [
        '### Failures and errors',
        ...detailed.map((problem) => renderProblem(problem)),
    ];
    if (unlisted.length > 0) {
        sections.push(renderUnlisted(unlisted));
    }
    return sections.join('\n\n');
}

function renderCoverage(coverage: CoverageSummary | undefined): string {
    if (!coverage) {
        return '';
    }
    const rows = Object.entries(coverage).map(([path, entry]) => {
        const name =
            path === 'total' ? '**Total**' : relative(process.cwd(), path);
        const cells = [
            entry.statements,
            entry.branches,
            entry.functions,
            entry.lines,
        ].map((metric) => formatPercent(metric));
        return `| ${name} | ${cells.join(' | ')} |`;
    });
    return [
        '### Coverage',
        '',
        '<details><summary>Coverage by file</summary>',
        '',
        '| File | Statements | Branches | Functions | Lines |',
        '| --- | ---: | ---: | ---: | ---: |',
        ...rows,
        '',
        '</details>',
    ].join('\n');
}

function summarizeVitestRun(argv: readonly string[]): number {
    const { values } = parseArgs({
        args: [...argv],
        options: {
            'json-report': { type: 'string' },
            'coverage-summary': { type: 'string', default: '' },
            project: { type: 'string', default: '' },
            'random-seed': { type: 'string', default: '' },
            workers: { type: 'string', default: '' },
            'node-version': { type: 'string', default: process.version },
        },
    });
    const jsonReport = values['json-report'];
    if (!jsonReport || !existsSync(jsonReport)) {
        process.stdout.write(
            '## :x: Vitest wrote no JSON report, see the job log\n',
        );
        return 1;
    }

    const report = readJson(jsonReport) as JsonReport;
    const coveragePath = values['coverage-summary'];
    const coverage =
        coveragePath && existsSync(coveragePath)
            ? (readJson(coveragePath) as CoverageSummary)
            : undefined;
    const problems = report.testResults.flatMap((file) =>
        readFileProblems(file),
    );
    const context: SummaryContext = {
        project: values.project,
        randomSeed: values['random-seed'],
        workers: values.workers,
        nodeVersion: values['node-version'],
    };

    const sections = [
        renderOverview(readTotals(report, problems), context, coverage),
        renderProblems(problems),
        renderCoverage(coverage),
    ];
    process.stdout.write(
        `${sections.filter((section) => section).join('\n\n')}\n`,
    );
    return 0;
}

function main(argv: readonly string[]): number {
    const [verb, ...rest] = argv;
    if (verb === 'resolve') {
        return resolveVitestRun(rest);
    }
    if (verb === 'summarize') {
        return summarizeVitestRun(rest);
    }
    process.stderr.write('usage: vitest_ci.ts resolve|summarize [options]\n');
    return 2;
}

process.exitCode = main(process.argv.slice(2));
