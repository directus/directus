import type { AbstractQueryNodeSort, AtLeastOneElement } from '@directus/data';
import { beforeEach, expect, test, vi } from 'vitest';
import { randomIdentifier } from '@directus/random';
import { convertSort, type SortConversionResult } from './sort.js';
import { parameterIndexGenerator } from '../param-index-generator.js';
import { convertTarget, type TargetConversionResult } from './target.js';
import type { AbstractSqlQuerySelectPrimitiveNode } from '../../index.js';

vi.mock('./target.js', (importOriginal) => {
	const original = importOriginal();
	return {
		...original,
		convertTarget: vi.fn(),
	};
});

let sample: AtLeastOneElement<AbstractQueryNodeSort>;
const localCollection = randomIdentifier();
const targetField = randomIdentifier();

beforeEach(() => {
	sample = [
		{
			type: 'sort',
			direction: 'ascending',
			target: {
				type: 'primitive',
				field: targetField,
			},
		},
	];
});

test('convert ascending sort with a single field', () => {
	const mock: TargetConversionResult = {
		value: {
			type: 'primitive',
			table: localCollection,
			column: targetField,
		},
		joins: [],
	};

	vi.mocked(convertTarget).mockReturnValueOnce(mock);

	const res = convertSort(sample, localCollection, parameterIndexGenerator());

	const expected: SortConversionResult = {
		clauses: {
			joins: [],
			order: [
				{
					type: 'order',
					orderBy: mock.value as AbstractSqlQuerySelectPrimitiveNode,
					direction: 'ASC',
				},
			],
		},
	};

	expect(res).toStrictEqual(expected);
});

test('convert descending sort with a single field', () => {
	sample[0]!.direction = 'descending';

	const mock: TargetConversionResult = {
		value: {
			type: 'primitive',
			table: randomIdentifier(),
			column: randomIdentifier(),
		},
		joins: [],
	};

	vi.mocked(convertTarget).mockReturnValueOnce(mock);

	const res = convertSort(sample, localCollection, parameterIndexGenerator());

	const expected: SortConversionResult = {
		clauses: {
			joins: [],
			order: [
				{
					type: 'order',
					orderBy: mock.value as AbstractSqlQuerySelectPrimitiveNode,
					direction: 'DESC',
				},
			],
		},
	};

	expect(res).toStrictEqual(expected);
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

	const mock1: TargetConversionResult = {
		value: {
			type: 'primitive',
			table: randomIdentifier(),
			column: randomIdentifier(),
		},
		joins: [],
	};

	vi.mocked(convertTarget).mockReturnValueOnce(mock1);

	const mock2: TargetConversionResult = {
		value: {
			type: 'primitive',
			table: randomIdentifier(),
			column: randomIdentifier(),
		},
		joins: [],
	};

	vi.mocked(convertTarget).mockReturnValueOnce(mock2);

	const res = convertSort(sample, localCollection, parameterIndexGenerator());

	const expected: SortConversionResult = {
		clauses: {
			joins: [],
			order: [
				{
					type: 'order',
					orderBy: mock1.value as AbstractSqlQuerySelectPrimitiveNode,
					direction: 'ASC',
				},
				{
					type: 'order',
					orderBy: mock2.value as AbstractSqlQuerySelectPrimitiveNode,
					direction: 'ASC',
				},
			],
		},
	};

	expect(res).toStrictEqual(expected);
});

test('convert sort on nested item', () => {
	const nestedSortSample: AbstractQueryNodeSort = {
		type: 'sort',
		direction: 'ascending',
		target: {
			type: 'nested-one-target',
			field: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			nesting: {
				type: 'relational-many',
				local: {
					fields: [randomIdentifier()],
				},
				foreign: {
					store: randomIdentifier(),
					collection: randomIdentifier(),
					fields: [randomIdentifier()],
				},
			},
		},
	};

	const mock: TargetConversionResult = {
		value: {
			type: 'primitive',
			table: randomIdentifier(),
			column: randomIdentifier(),
		},
		joins: [
			{
				type: 'join',
				table: randomIdentifier(),
				as: randomIdentifier(),
				on: {
					type: 'condition',
					negate: false,
					condition: {
						type: 'condition-field',
						target: {
							type: 'primitive',
							table: randomIdentifier(),
							column: randomIdentifier(),
						},
						operation: 'eq',
						compareTo: {
							type: 'primitive',
							table: randomIdentifier(),
							column: randomIdentifier(),
						},
					},
				},
			},
		],
	};

	vi.mocked(convertTarget).mockReturnValueOnce(mock);
	const res = convertSort([nestedSortSample], localCollection, parameterIndexGenerator());

	const expected: SortConversionResult = {
		clauses: {
			joins: mock.joins,
			order: [
				{
					type: 'order',
					orderBy: mock.value as AbstractSqlQuerySelectPrimitiveNode,
					direction: 'ASC',
				},
			],
		},
	};

	expect(res).toStrictEqual(expected);
});
