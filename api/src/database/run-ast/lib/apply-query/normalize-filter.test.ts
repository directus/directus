import { describe, expect, test } from 'vitest';
import { normalizeFilter } from './normalize-filter.js';

describe('normalizeFilter', () => {
	test('returns empty filter unchanged', () => {
		expect(normalizeFilter({})).toEqual({});
	});

	test('returns simple operator filter unchanged', () => {
		const filter = { field: { _eq: 'value' } };
		expect(normalizeFilter(filter)).toEqual(filter);
	});

	test('returns single relational path unchanged', () => {
		const filter = { rel: { sub: { _eq: 'value' } } };
		expect(normalizeFilter(filter)).toEqual(filter);
	});

	test('returns deep single relational path unchanged', () => {
		const filter = { a: { b: { c: { d: { _eq: 1 } } } } };
		expect(normalizeFilter(filter)).toEqual(filter);
	});

	test('splits sibling relational keys into _and', () => {
		const filter = {
			rel: {
				field_a: { _eq: 1 },
				field_b: { _eq: 2 },
			},
		};

		expect(normalizeFilter(filter)).toEqual({
			_and: [
				{ rel: { field_a: { _eq: 1 } } },
				{ rel: { field_b: { _eq: 2 } } },
			],
		});
	});

	test('splits deeply nested sibling keys', () => {
		const filter = {
			a: {
				b: {
					c: { _eq: 1 },
					d: { _eq: 2 },
				},
			},
		};

		expect(normalizeFilter(filter)).toEqual({
			_and: [
				{ a: { b: { c: { _eq: 1 } } } },
				{ a: { b: { d: { _eq: 2 } } } },
			],
		});
	});

	test('splits at multiple nesting levels', () => {
		const filter = {
			a: {
				b: {
					x: { _eq: 1 },
					y: { _eq: 2 },
				},
				c: { _eq: 3 },
			},
		};

		expect(normalizeFilter(filter)).toEqual({
			_and: [
				{ a: { b: { x: { _eq: 1 } } } },
				{ a: { b: { y: { _eq: 2 } } } },
				{ a: { c: { _eq: 3 } } },
			],
		});
	});

	test('preserves _and arrays and normalizes their contents', () => {
		const filter = {
			_and: [
				{
					rel: {
						a: { _eq: 1 },
						b: { _eq: 2 },
					},
				},
			],
		};

		expect(normalizeFilter(filter)).toEqual({
			_and: [
				{
					_and: [
						{ rel: { a: { _eq: 1 } } },
						{ rel: { b: { _eq: 2 } } },
					],
				},
			],
		});
	});

	test('preserves _or arrays and normalizes their contents', () => {
		const filter = {
			_or: [
				{
					rel: {
						a: { _eq: 1 },
						b: { _eq: 2 },
					},
				},
			],
		};

		expect(normalizeFilter(filter)).toEqual({
			_or: [
				{
					_and: [
						{ rel: { a: { _eq: 1 } } },
						{ rel: { b: { _eq: 2 } } },
					],
				},
			],
		});
	});

	test('handles mixed operator and relational keys', () => {
		const filter = {
			field: {
				_eq: 'direct',
				sub: { _eq: 'nested' },
			},
		};

		expect(normalizeFilter(filter)).toEqual({
			_and: [
				{ field: { sub: { _eq: 'nested' } } },
				{ field: { _eq: 'direct' } },
			],
		});
	});

	test('keeps multiple operator keys on same field together', () => {
		const filter = { field: { _gte: 1, _lte: 10 } };
		expect(normalizeFilter(filter)).toEqual(filter);
	});

	test('handles _some as relational key', () => {
		const filter = {
			rel: {
				_some: { field: { _eq: 1 } },
				other: { _eq: 2 },
			},
		};

		expect(normalizeFilter(filter)).toEqual({
			_and: [
				{ rel: { _some: { field: { _eq: 1 } } } },
				{ rel: { other: { _eq: 2 } } },
			],
		});
	});

	test('handles _none as relational key', () => {
		const filter = {
			rel: {
				_none: { field: { _eq: 1 } },
				other: { _eq: 2 },
			},
		};

		expect(normalizeFilter(filter)).toEqual({
			_and: [
				{ rel: { _none: { field: { _eq: 1 } } } },
				{ rel: { other: { _eq: 2 } } },
			],
		});
	});

	test('preserves flat structure when top-level keys are unique', () => {
		const filter = {
			field_a: { _eq: 1 },
			field_b: { _eq: 2 },
			rel: { sub: { _eq: 3 } },
		};

		expect(normalizeFilter(filter)).toEqual(filter);
	});

	test('handles non-object filter values', () => {
		const filter = { field: 'direct-value' };
		expect(normalizeFilter(filter as any)).toEqual({ field: 'direct-value' });
	});

	test('reproduces the user scenario: nested m2o chain with sibling filters', () => {
		const filter = {
			user_created: { _eq: 'user-id' },
			day: { _in: ['2026-04-13', '2026-04-14'] },
			course_part: {
				course: {
					teaching_unit: {
						status: { _eq: 'active' },
						discipline: {
							status: { _eq: 'active' },
							enrollment: {
								status: { _eq: 'active' },
							},
						},
					},
					status: { _eq: 'active' },
				},
			},
		};

		const normalized = normalizeFilter(filter);

		// All paths should be fully separated - each with a single relational chain
		expect(normalized).toEqual({
			_and: [
				{ user_created: { _eq: 'user-id' } },
				{ day: { _in: ['2026-04-13', '2026-04-14'] } },
				{ course_part: { course: { teaching_unit: { status: { _eq: 'active' } } } } },
				{ course_part: { course: { teaching_unit: { discipline: { status: { _eq: 'active' } } } } } },
				{ course_part: { course: { teaching_unit: { discipline: { enrollment: { status: { _eq: 'active' } } } } } } },
				{ course_part: { course: { status: { _eq: 'active' } } } },
			],
		});
	});
});
