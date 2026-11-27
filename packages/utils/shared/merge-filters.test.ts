import { describe, expect, it } from 'vitest';
import { mergeFilters } from './merge-filters.js';

describe('merge filters', () => {
	it('defaults to A when B is null', () => {
		const A = {};
		const B = null;
		expect(mergeFilters(A, B)).toEqual(A);
	});

	it('defaults to B when A is null', () => {
		const A = null;
		const B = {};
		expect(mergeFilters(A, B)).toEqual(B);
	});

	it('merges with an _and by default', () => {
		const A = { a: { _eq: 1 } };
		const B = { b: { _eq: 2 } };

		expect(mergeFilters(A, B)).toStrictEqual({ _and: [A, B] });
	});

	it('allows merging on _or with a parameter', () => {
		const A = { a: { _eq: 1 } };
		const B = { b: { _eq: 2 } };

		expect(mergeFilters(A, B, 'or')).toStrictEqual({ _or: [A, B] });
	});
});

describe('merge filters from an array', () => {
	const A = { a: { _eq: 1 } };
	const B = { b: { _eq: 2 } };
	const C = { c: { _eq: 3 } };

	it('merges all filters with an _and by default', () => {
		expect(mergeFilters([A, B, C])).toStrictEqual({ _and: [A, B, C] });
	});

	it('allows merging on _or with a parameter', () => {
		expect(mergeFilters([A, B, C], 'or')).toStrictEqual({ _or: [A, B, C] });
	});

	it('skips null and undefined filters', () => {
		expect(mergeFilters([A, null, undefined, C])).toStrictEqual({ _and: [A, C] });
	});

	it('returns the single remaining filter as is', () => {
		expect(mergeFilters([null, B, undefined])).toBe(B);
	});

	it('returns null when no filters are left', () => {
		expect(mergeFilters([])).toBeNull();
		expect(mergeFilters([null, undefined])).toBeNull();
	});
});
