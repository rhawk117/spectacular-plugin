// Resolves Vitest arguments for the test-suite action, then summarizes its run. Port of mightymodels' pytest_ci.py.

import { randomInt } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';

import {
    renderSummary,
    type Problem,
    type SuiteTotals,
    type SummaryContext,
} from './summary_markdown.js';
import {
    parseCoverageSummary,
    parseJsonReport,
    parsePackageVersion,
    type FileResult,
    type JsonReport,
} from './vitest_report.js';

const SEED_LIMIT = 4_294_967_296;
const MILLISECONDS_PER_SECOND = 1000;
const USAGE_EXIT_CODE = 2;
const SCRIPT_ARGUMENTS_START = 2;

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
        seconds: (finishedAt - report.startTime) / MILLISECONDS_PER_SECOND,
    };
}

function readVitestVersion(): string {
    const manifestPath = join(
        process.cwd(),
        'node_modules',
        'vitest',
        'package.json',
    );
    return parsePackageVersion(readJson(manifestPath));
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

    const report = parseJsonReport(readJson(jsonReport));
    const coveragePath = values['coverage-summary'];
    const coverage =
        coveragePath && existsSync(coveragePath)
            ? parseCoverageSummary(readJson(coveragePath))
            : undefined;
    const problems = report.testResults.flatMap((file) =>
        readFileProblems(file),
    );
    const context: SummaryContext = {
        project: values.project,
        randomSeed: values['random-seed'],
        workers: values.workers,
        nodeVersion: values['node-version'],
        vitestVersion: readVitestVersion(),
        rootDir: process.cwd(),
    };

    const totals = readTotals(report, problems);
    process.stdout.write(
        renderSummary({ totals, problems, coverage, context }),
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
    return USAGE_EXIT_CODE;
}

process.exitCode = main(process.argv.slice(SCRIPT_ARGUMENTS_START));
