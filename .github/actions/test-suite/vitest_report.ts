// Narrows the JSON that Vitest, its coverage reporter and package.json write into typed values, failing loudly on a mismatch.

import type {
    CoverageEntry,
    CoverageMetric,
    CoverageSummary,
} from './summary_markdown.js';

export interface AssertionResult {
    readonly fullName: string;
    readonly status: string;
    readonly failureMessages: readonly string[];
}

export interface FileResult {
    readonly name: string;
    readonly status: string;
    readonly message: string;
    readonly endTime: number;
    readonly assertionResults: readonly AssertionResult[];
}

export interface JsonReport {
    readonly numPassedTests: number;
    readonly numFailedTests: number;
    readonly numPendingTests: number;
    readonly numTodoTests: number;
    readonly startTime: number;
    readonly testResults: readonly FileResult[];
}

export class ReportFormatError extends Error {
    override name = 'ReportFormatError';
}

type JsonObject = Readonly<Record<string, unknown>>;

function isJsonObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function expectObject(value: unknown, path: string): JsonObject {
    if (!isJsonObject(value)) {
        throw new ReportFormatError(`${path} is not an object`);
    }
    return value;
}

function readString(object: JsonObject, key: string, path: string): string {
    const value = object[key];
    if (typeof value !== 'string') {
        throw new ReportFormatError(`${path}.${key} is not a string`);
    }
    return value;
}

function readNumber(object: JsonObject, key: string, path: string): number {
    const value = object[key];
    if (typeof value !== 'number') {
        throw new ReportFormatError(`${path}.${key} is not a number`);
    }
    return value;
}

function readArray(
    object: JsonObject,
    key: string,
    path: string,
): readonly unknown[] {
    const value = object[key];
    if (!Array.isArray(value)) {
        throw new ReportFormatError(`${path}.${key} is not an array`);
    }
    return value;
}

function readStringArray(
    object: JsonObject,
    key: string,
    path: string,
): readonly string[] {
    const items = readArray(object, key, path);
    return items.map((item, index) => {
        if (typeof item !== 'string') {
            throw new ReportFormatError(
                `${path}.${key}[${String(index)}] is not a string`,
            );
        }
        return item;
    });
}

function parseAssertionResult(value: unknown, path: string): AssertionResult {
    const assertion = expectObject(value, path);
    return {
        fullName: readString(assertion, 'fullName', path),
        status: readString(assertion, 'status', path),
        failureMessages: readStringArray(assertion, 'failureMessages', path),
    };
}

function parseFileResult(value: unknown, path: string): FileResult {
    const file = expectObject(value, path);
    const assertions = readArray(file, 'assertionResults', path);
    const assertionResults = assertions.map((assertion, index) =>
        parseAssertionResult(
            assertion,
            `${path}.assertionResults[${String(index)}]`,
        ),
    );
    return {
        name: readString(file, 'name', path),
        status: readString(file, 'status', path),
        message: readString(file, 'message', path),
        endTime: readNumber(file, 'endTime', path),
        assertionResults,
    };
}

export function parseJsonReport(value: unknown): JsonReport {
    const path = 'report';
    const report = expectObject(value, path);
    const files = readArray(report, 'testResults', path);
    const testResults = files.map((file, index) =>
        parseFileResult(file, `${path}.testResults[${String(index)}]`),
    );
    return {
        numPassedTests: readNumber(report, 'numPassedTests', path),
        numFailedTests: readNumber(report, 'numFailedTests', path),
        numPendingTests: readNumber(report, 'numPendingTests', path),
        numTodoTests: readNumber(report, 'numTodoTests', path),
        startTime: readNumber(report, 'startTime', path),
        testResults,
    };
}

function parseCoverageMetric(
    entry: JsonObject,
    key: string,
    path: string,
): CoverageMetric {
    const metric = expectObject(entry[key], `${path}.${key}`);
    const percent = metric.pct;
    if (typeof percent !== 'number' && typeof percent !== 'string') {
        throw new ReportFormatError(`${path}.${key}.pct is not a percentage`);
    }
    return { pct: percent };
}

function parseCoverageEntry(value: unknown, path: string): CoverageEntry {
    const entry = expectObject(value, path);
    return {
        lines: parseCoverageMetric(entry, 'lines', path),
        statements: parseCoverageMetric(entry, 'statements', path),
        functions: parseCoverageMetric(entry, 'functions', path),
        branches: parseCoverageMetric(entry, 'branches', path),
    };
}

export function parseCoverageSummary(value: unknown): CoverageSummary {
    const summary = expectObject(value, 'coverage summary');
    const entries = Object.entries(summary).map(
        ([filePath, entry]): [string, CoverageEntry] => [
            filePath,
            parseCoverageEntry(entry, filePath),
        ],
    );
    return new Map(entries);
}

export function parsePackageVersion(value: unknown): string {
    const path = 'package.json';
    return readString(expectObject(value, path), 'version', path);
}
