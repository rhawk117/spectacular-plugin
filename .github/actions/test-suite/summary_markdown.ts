// Renders the Markdown job summary of a Vitest run from values that vitest_ci.ts reads.

import { relative } from 'node:path';

export type ProblemKind = 'failure' | 'error';

export interface CoverageMetric {
    readonly pct: number | string;
}

export interface CoverageEntry {
    readonly lines: CoverageMetric;
    readonly statements: CoverageMetric;
    readonly functions: CoverageMetric;
    readonly branches: CoverageMetric;
}

export type CoverageSummary = Readonly<Record<string, CoverageEntry>>;

export interface Problem {
    readonly kind: ProblemKind;
    readonly testId: string;
    readonly details: string;
}

export interface SuiteTotals {
    readonly passed: number;
    readonly failures: number;
    readonly errors: number;
    readonly skipped: number;
    readonly todo: number;
    readonly seconds: number;
}

export interface SummaryContext {
    readonly project: string;
    readonly randomSeed: string;
    readonly workers: string;
    readonly nodeVersion: string;
    readonly vitestVersion: string;
    readonly rootDir: string;
}

export interface RunSummary {
    readonly totals: SuiteTotals;
    readonly problems: readonly Problem[];
    readonly coverage: CoverageSummary | undefined;
    readonly context: SummaryContext;
}

const DETAILED_PROBLEMS = 20;
const LISTED_PROBLEMS = 100;
const TRACEBACK_CHARACTERS = 4000;
const MINIMUM_FENCE_LENGTH = 3;
const DURATION_DECIMALS = 2;

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

function renderOverview(summary: RunSummary): string {
    const { totals, context, coverage } = summary;
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
        `| ${cells.join(' | ')} | ${totals.seconds.toFixed(DURATION_DECIMALS)}s |`,
        '',
        `- **Node** ${context.nodeVersion}, **Vitest** ${context.vitestVersion}`,
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

function renderCoverage(
    coverage: CoverageSummary | undefined,
    rootDir: string,
): string {
    if (!coverage) {
        return '';
    }
    const rows = Object.entries(coverage).map(([path, entry]) => {
        const name = path === 'total' ? '**Total**' : relative(rootDir, path);
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

export function renderSummary(summary: RunSummary): string {
    const sections = [
        renderOverview(summary),
        renderProblems(summary.problems),
        renderCoverage(summary.coverage, summary.context.rootDir),
    ];
    const filledSections = sections.filter((section) => section.length > 0);
    return `${filledSections.join('\n\n')}\n`;
}
