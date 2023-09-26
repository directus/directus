import type { AbstractQueryNodeSort } from '@directus/data';
import { beforeEach, expect, test } from 'vitest';
import { randomIdentifier } from '@directus/random';
import { convertSort } from './sort.js';

let sample: AbstractQueryNodeSort[];

beforeEach(() => {
	sample = [
		{
			type: 'sort',
			direction: 'ascending',
			target: {
				type: 'primitive',
				field: randomIdentifier(),
			},
		},
	];
});

test('convert ascending sort with a single field', () => {
	const res = convertSort(sample);

	expect(res).toStrictEqual([
		{
			type: 'order',
			orderBy: sample[0]!.target,
			direction: 'ASC',
		},
	]);
});

test('convert descending sort with a single field', () => {
	sample[0]!.direction = 'descending';
	const res = convertSort(sample);

	expect(res).toStrictEqual([
		{
			type: 'order',
			orderBy: sample[0]!.target,
			direction: 'DESC',
		},
	]);
});

test('convert ascending sort with multiple fields', () => {
	sample.push({
		type: 'sort',
		direction: 'ascending',
		target: {
			type: 'primitive',
			field: randomIdentifier(),
		},
	});

	const res = convertSort(sample);

	expect(res).toStrictEqual([
		{
			type: 'order',
			orderBy: sample[0]!.target,
			direction: 'ASC',
		},
		{
			type: 'order',
			orderBy: sample[1]!.target,
			direction: 'ASC',
		},
	]);
});
