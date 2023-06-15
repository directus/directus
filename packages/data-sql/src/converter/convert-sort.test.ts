import type { AbstractQueryNodeSort } from '@directus/data';
import { beforeEach, expect, test } from 'vitest';
import { randomIdentifier } from '@directus/random';
import { convertSort } from './convert-sort.js';

let sample: {
	sortNode: AbstractQueryNodeSort;
};

beforeEach(() => {
	sample = {
		sortNode: {
			type: 'sort',
			direction: 'ascending',
			target: {
				type: 'primitive',
				field: randomIdentifier(),
			},
		},
	};
});

test('convert ascending sort', () => {
	const res = convertSort(sample.sortNode);

	expect(res).toStrictEqual({
		orderBy: 0,
		order: 'ASC',
		parameters: [sample.sortNode.target],
	});
});

test('convert descending sort', () => {
	sample.sortNode.direction = 'descending';
	const res = convertSort(sample.sortNode);

	expect(res).toStrictEqual({
		orderBy: 0,
		order: 'DESC',
		parameters: [sample.sortNode.target],
	});
});
