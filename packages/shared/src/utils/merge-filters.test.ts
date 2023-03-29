import { describe, expect, it } from 'vitest';
import { mergeFilters } from './merge-filters';

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
