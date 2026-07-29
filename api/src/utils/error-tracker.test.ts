import { describe, expect, test, vi } from 'vitest';
import { createErrorTracker } from './error-tracker.js';

vi.mock('@directus/env', () => ({
	useEnv: () => ({
		MAX_IMPORT_ERRORS: 1000,
	}),
}));

describe('createErrorTracker', () => {
	test('groups errors with same field and type', () => {
		const tracker = createErrorTracker();

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'nnull' },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'nnull' },
			},
			3,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0].extensions.field).toBe('email');
		expect(errors[0].extensions.type).toBe('nnull');
		expect(errors[0].extensions.rows).toHaveLength(1);
		expect(errors[0].extensions.rows[0]?.type).toBe('lines');
		expect(errors[0].extensions.rows[0]?.rows).toEqual([1, 3]);
	});

	test('separates errors with different substring values', () => {
		const tracker = createErrorTracker();

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'contains', substring: 'later' },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'contains', substring: 'now' },
			},
			2,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(2);
		expect(errors[0].extensions.substring).toBe('later');
		expect(errors[0].extensions.rows[0].rows).toEqual([1]);
		expect(errors[1].extensions.substring).toBe('now');
		expect(errors[1].extensions.rows[0].rows).toEqual([2]);
	});

	test('separates errors with different valid values', () => {
		const tracker = createErrorTracker();
		const code = 'FAILED_VALIDATION';

		tracker.addCapturedError(
			{
				code,
				message: 'test',
				extensions: { field: 'age', type: 'eq', valid: 18 },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code,
				message: 'test',
				extensions: { field: 'age', type: 'eq', valid: 21 },
			},
			2,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(2);
		expect(errors[0].extensions.valid).toBe(18);
		expect(errors[1].extensions.valid).toBe(21);
	});

	test('converts consecutive rows to ranges', () => {
		const tracker = createErrorTracker();

		for (let i = 1; i <= 10; i++) {
			tracker.addCapturedError(
				{
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'nnull' },
				},
				i,
			);
		}

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0].extensions.rows).toHaveLength(1);
		expect(errors[0].extensions.rows[0].type).toBe('range');
		expect(errors[0].extensions.rows[0].start).toBe(1);
		expect(errors[0].extensions.rows[0].end).toBe(10);
	});

	test('stops collecting errors at MAX_IMPORT_ERRORS', () => {
		const tracker = createErrorTracker();

		for (let i = 1; i <= 1500; i++) {
			tracker.addCapturedError(
				{
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'nnull' },
				},
				i,
			);

			if (tracker.shouldStop()) break;
		}

		expect(tracker.getCount()).toBe(1000);
		expect(tracker.shouldStop()).toBe(true);
	});

	test('stops immediately on error without field', () => {
		const tracker = createErrorTracker();

		const nonFieldError = {
			code: 'INVALID_FOREIGN_KEY',
			message: 'test',
			extensions: {},
		};

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'validation failed',
				extensions: { field: 'email', type: 'nnull' },
			},
			1,
		);

		tracker.addCapturedError(nonFieldError, 2);

		expect(tracker.shouldStop()).toBe(true);
		expect(tracker.hasGenericError()).toBe(true);

		const errors: any[] = tracker.buildFinalErrors();
		expect(errors).toHaveLength(1);
		expect(errors[0]).toBe(nonFieldError);
	});

	test('separates errors with different invalid values', () => {
		const tracker = createErrorTracker();

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'status', type: 'in', invalid: 'pending' },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'status', type: 'in', invalid: 'archived' },
			},
			2,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(2);
		expect(errors[0].extensions.invalid).toBe('pending');
		expect(errors[0].extensions.rows[0].rows).toEqual([1]);
		expect(errors[1].extensions.invalid).toBe('archived');
		expect(errors[1].extensions.rows[0].rows).toEqual([2]);
	});

	test('handles multiple error codes', () => {
		const tracker = createErrorTracker();

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'email' },
			},
			1,
		);

		tracker.addCapturedError(
			{
				code: 'FAILED_VALIDATION',
				message: 'test',
				extensions: { field: 'email', type: 'email' },
			},
			2,
		);

		tracker.addCapturedError(
			{
				code: 'CONTAINS_NULL_VALUES',
				message: 'test',
				extensions: { field: 'name', type: 'nnull' },
			},
			3,
		);

		tracker.addCapturedError(
			{
				code: 'INVALID_FOREIGN_KEY',
				message: 'test',
				extensions: { field: 'author_id', collection: 'authors' },
			},
			4,
		);

		tracker.addCapturedError(
			{
				code: 'INVALID_FOREIGN_KEY',
				message: 'test',
				extensions: { field: 'author_id', collection: 'authors' },
			},
			5,
		);

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(3);

		const validationError = errors.find((e) => e.code === 'FAILED_VALIDATION');
		expect(validationError).toBeDefined();
		expect(validationError.extensions.field).toBe('email');
		expect(validationError.extensions.rows[0].rows).toEqual([1, 2]);

		const nullError = errors.find((e) => e.code === 'CONTAINS_NULL_VALUES');
		expect(nullError).toBeDefined();
		expect(nullError.extensions.field).toBe('name');
		expect(nullError.extensions.rows[0].rows).toEqual([3]);

		const fkError = errors.find((e) => e.code === 'INVALID_FOREIGN_KEY');
		expect(fkError).toBeDefined();
		expect(fkError.extensions.field).toBe('author_id');
		expect(fkError.extensions.rows[0].rows).toEqual([4, 5]);
	});

	test('returns empty array when no errors tracked', () => {
		const tracker = createErrorTracker();

		expect(tracker.hasErrors()).toBe(false);
		expect(tracker.getCount()).toBe(0);
		expect(tracker.shouldStop()).toBe(false);

		const errors = tracker.buildFinalErrors();
		expect(errors).toEqual([]);
	});

	test('handles mix of consecutive ranges and non-consecutive lines', () => {
		const tracker = createErrorTracker();

		const rows = [1, 2, 3, 4, 10, 15, 16, 17, 18, 25, 30];

		for (const row of rows) {
			tracker.addCapturedError(
				{
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'email' },
				},
				row,
			);
		}

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0].extensions.rows).toHaveLength(3);

		const ranges = errors[0].extensions.rows.filter((r: any) => r.type === 'range');
		const lines = errors[0].extensions.rows.filter((r: any) => r.type === 'lines');

		expect(ranges).toHaveLength(2);
		expect(lines).toHaveLength(1);

		expect(ranges[0].start).toBe(1);
		expect(ranges[0].end).toBe(4);

		expect(ranges[1].start).toBe(15);
		expect(ranges[1].end).toBe(18);

		expect(lines[0].rows).toEqual([10, 25, 30]);
	});

	test('handles exactly minRangeSize consecutive rows', () => {
		const tracker = createErrorTracker();

		for (let i = 1; i <= 4; i++) {
			tracker.addCapturedError(
				{
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'email' },
				},
				i,
			);
		}

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0].extensions.rows).toHaveLength(1);
		expect(errors[0].extensions.rows[0].type).toBe('range');
		expect(errors[0].extensions.rows[0].start).toBe(1);
		expect(errors[0].extensions.rows[0].end).toBe(4);
	});

	test('handles less than minRangeSize consecutive rows', () => {
		const tracker = createErrorTracker();

		for (let i = 1; i <= 3; i++) {
			tracker.addCapturedError(
				{
					code: 'FAILED_VALIDATION',
					message: 'test',
					extensions: { field: 'email', type: 'email' },
				},
				i,
			);
		}

		const errors: any[] = tracker.buildFinalErrors();

		expect(errors).toHaveLength(1);
		expect(errors[0].extensions.rows).toHaveLength(1);
		expect(errors[0].extensions.rows[0].type).toBe('lines');
		expect(errors[0].extensions.rows[0].rows).toEqual([1, 2, 3]);
	});
});
