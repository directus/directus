import { expect, test } from 'vitest';
import { filter_has_now } from './permissions-cachable.js';
import type { Filter } from '@directus/types';

test('filter has $NOW', () => {
	let filter: Filter = {
		created_on: {
			_gt: '$NOW',
		},
	};

	expect(filter_has_now(filter)).toBe(true);

	filter = {
		_and: [
			{
				created_on: {
					_gt: '$NOW',
				},
			},
		],
	};

	expect(filter_has_now(filter)).toBe(true);

	filter = {
		_or: [
			{
				created_on: {
					some: {
						_gt: '$NOW(-1 year)',
					},
				},
			},
		],
	};

	expect(filter_has_now(filter)).toBe(true);
});

test('filter does not have $NOW', () => {
	let filter: Filter = {
		created_on: {
			_gt: '2021-01-01',
		},
	};

	expect(filter_has_now(filter)).toBe(false);

	filter = {
		_and: [
			{
				created_on: {
					_gt: '2021-01-01',
				},
			},
		],
	};

	expect(filter_has_now(filter)).toBe(false);

	filter = {
		_or: [
			{
				created_on: {
					some: {
						_gt: '2021-01-01',
					},
				},
			},
		],
	};

	expect(filter_has_now(filter)).toBe(false);
});
