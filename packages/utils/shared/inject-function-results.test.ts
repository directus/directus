import { describe, expect, it } from 'vitest';
import { injectFunctionResults } from './inject-function-results.js';

describe('injectFunctionResults', () => {
	it('Passes the original object unchanged if no filter rules apply', () => {
		const input = { date: '2022-03-30T09:36:27Z' };
		const filter = {};
		const output = injectFunctionResults(input, filter);
		expect(output).toEqual(input);
	});

	it(`Doesn't modify the original object`, () => {
		const input = { date: '2022-03-30T09:36:27Z' };
		const filter = {};
		const output = injectFunctionResults(input, filter);
		expect(output).not.toBe(input);
	});

	it(`Skips over filter rules with unknown fieldkeys or function names`, () => {
		const input = { date: '2022-03-30T09:36:27Z' };

		const filter = { '()': 'wrong', 'another()': 'wrong' } as any;

		const output = injectFunctionResults(input, filter);
		expect(output).toEqual(input);
	});

	it(`Recursively loops over filter and injects results`, () => {
		const input = {
			date: '2022-03-30T09:36:27Z',
			nested: {
				anotherDate: '2022-03-30T09:36:27Z',
			},
		};

		const filter = {
			'year(date)': {
				_eq: 2022,
			},
			nested: {
				'month(anotherDate)': {
					_lte: 3,
				},
			},
		};

		const output = injectFunctionResults(input, filter);

		expect(output).toEqual({
			date: '2022-03-30T09:36:27Z',
			'year(date)': 2022,
			nested: {
				anotherDate: '2022-03-30T09:36:27Z',
				'month(anotherDate)': 3,
			},
		});
	});

	describe('count() for m:n / array fields', () => {
		it('injects count(photos) as array length when payload has array', () => {
			const input = { photos: [1, 2] };
			const filter = { 'count(photos)': { _eq: 2 } };
			const output = injectFunctionResults(input, filter);
			expect(output).toHaveProperty('count(photos)', 2);
			expect(output['photos']).toEqual([1, 2]);
		});

		it('injects count(photos) as null when payload has no key or non-array', () => {
			const filter = { 'count(photos)': { _eq: 2 } };
			expect(injectFunctionResults({}, filter)).toHaveProperty('count(photos)', null);
			expect(injectFunctionResults({ photos: null }, filter)).toHaveProperty('count(photos)', null);
		});
	});
});
