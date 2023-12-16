import type { AbstractSqlClauses } from '@directus/data-sql';
import { randomIdentifier } from '@directus/random';
import { beforeEach, expect, test, vi } from 'vitest';
import { orderBy } from './orderBy.js';
import { applyFunction } from '../utils/functions.js';

vi.mock('../utils/functions.js', async (importOriginal) => {
	const mod = await importOriginal<typeof import('../utils/functions.js')>();
	return {
		...mod,
		applyFunction: vi.fn(),
	};
});

let sample: AbstractSqlClauses;

const randomTable = randomIdentifier();

beforeEach(() => {
	sample = {
		select: [],
		from: randomTable,
	};
});

test('Empty parametrized statement when order is not defined', () => {
	expect(orderBy(sample)).toStrictEqual(null);
});

test('Returns order part for one primitive field', () => {
	const field = randomIdentifier();

	sample.order = [
		{
			orderBy: {
				type: 'primitive',
				column: field,
				table: randomTable,
			},
			type: 'order',
			direction: 'ASC',
		},
	];

	const expected = `ORDER BY "${randomTable}"."${field}" ASC`;

	expect(orderBy(sample)).toStrictEqual(expected);
});

test('Returns order part for multiple primitive fields', () => {
	const field1 = randomIdentifier();
	const field2 = randomIdentifier();

	sample.order = [
		{
			orderBy: {
				type: 'primitive',
				column: field1,
				table: randomTable,
			},
			type: 'order',
			direction: 'ASC',
		},
		{
			orderBy: {
				type: 'primitive',
				column: field2,
				table: randomTable,
			},
			type: 'order',
			direction: 'DESC',
		},
	];

	const expected = `ORDER BY "${randomTable}"."${field1}" ASC, "${randomTable}"."${field2}" DESC`;

	expect(orderBy(sample)).toStrictEqual(expected);
});

test('Returns order part when a function was applied', () => {
	const field1 = randomIdentifier();

	sample.order = [
		{
			orderBy: {
				type: 'fn',
				column: field1,
				table: randomTable,
				fn: {
					type: 'arrayFn',
					fn: 'count',
				},
			},
			type: 'order',
			direction: 'ASC',
		},
	];

	const fnMock = `COUNT("${randomTable}"."${field1}")`;
	vi.mocked(applyFunction).mockReturnValueOnce(fnMock);
	const expected = `ORDER BY ${fnMock} ASC`;
	expect(orderBy(sample)).toStrictEqual(expected);
});
