import type { AbstractQueryNodeSort } from '@directus/data';
import { beforeEach, expect, test } from 'vitest';
import { randomIdentifier } from '@directus/random';
import { convertSort } from './convert-sort.js';

let sample: {
	sort: AbstractQueryNodeSort[];
};

beforeEach(() => {
	sample = {
		sort: [
			{
				type: 'sort',
				direction: 'ascending',
				target: {
					type: 'primitive',
					field: randomIdentifier(),
				},
			},
		],
	};
});

test('convert ascending sort', () => {
	const res = convertSort(sample.sort);

	expect(res).toStrictEqual([
		{
			orderBy: sample.sort[0]?.target,
			order: 'ASC',
		},
	]);
});

test('convert descending sort', () => {
	// @ts-ignore
	sample.sort[0].direction = 'descending';
	const res = convertSort(sample.sort);

	expect(res).toStrictEqual([
		{
			// @ts-ignore
			orderBy: sample.sort[0]?.target,
			order: 'DESC',
		},
	]);
});

test('convert multiple sorts', () => {
	// @ts-ignore
	sample.sort.push({
		type: 'sort',
		direction: 'ascending',
		target: {
			type: 'primitive',
			field: randomIdentifier(),
		},
	});

	const res = convertSort(sample.sort);

	expect(res).toStrictEqual([
		{
			orderBy: sample.sort[0]?.target,
			order: 'ASC',
		},
		{
			orderBy: sample.sort[1]?.target,
			order: 'ASC',
		},
	]);
});
