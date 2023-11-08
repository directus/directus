import type { AbstractQueryNodeSort } from '@directus/data';
import { beforeEach, expect, test, vi } from 'vitest';
import { randomIdentifier } from '@directus/random';
import { convertSort, type SortConversionResult } from './sort.js';
import { parameterIndexGenerator } from '../param-index-generator.js';
import { convertTarget, type TargetConversionResult } from './filter/conditions/utils.js';

vi.mock('./filter/conditions/utils.js', (importOriginal) => {
	const original = importOriginal();
	return {
		...original,
		convertTarget: vi.fn(),
	};
});

let sample: AbstractQueryNodeSort[];
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

	vi.mocked(convertTarget).mockReturnValueOnce({
		value: {
			type: 'primitive',
			table: localCollection,
			column: targetField,
		},
		joins: [],
	});

	const res = convertSort(sample, localCollection, parameterIndexGenerator());

	const expected: SortConversionResult = {
		clauses: {
			joins: [],
			order: [{
				type: 'order',
				orderBy: {
					type: 'primitive',
					table: localCollection,
					column: targetField,
				},
				direction: 'ASC',
			}],
		},
	};

	expect(res).toStrictEqual(expected);
});

test('convert descending sort with a single field', () => {
	sample[0]!.direction = 'descending';

	vi.mocked(convertTarget).mockReturnValueOnce({
		value: {
			type: 'primitive',
			table: localCollection,
			column: targetField,
		},
		joins: [],
	});

	const res = convertSort(sample, localCollection, parameterIndexGenerator());

	const expected: SortConversionResult = {
		clauses: {
			joins: [],
			order: [{
				type: 'order',
				orderBy: {
					type: 'primitive',
					table: localCollection,
					column: targetField,
				},
				direction: 'DESC',
			}],
		},
	};

	expect(res).toStrictEqual(expected);


});

test('convert ascending sort with multiple fields', () => {
	const secondSortField = randomIdentifier();

	sample.push({
		type: 'sort',
		direction: 'ascending',
		target: {
			type: 'primitive',
			field: secondSortField,
		},
	});

	const mock1: TargetConversionResult = {
		value: {
			type: 'primitive',
			table: localCollection,
			column: targetField,
		},
		joins: [],
	};

	vi.mocked(convertTarget).mockReturnValueOnce(mock1);

	const mock2: TargetConversionResult = {
		value: {
			type: 'primitive',
			table: localCollection,
			column: secondSortField,
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
					orderBy: mock1.value,
					direction: 'ASC',
				},
				{
					type: 'order',
					orderBy: mock2.value,
					direction: 'ASC',
				}
			],
		},
	};

	expect(res).toStrictEqual(expected);
});

test('convert sort on nested item', () => {
	const leftIdField = randomIdentifier();
	const rightIdField = randomIdentifier();
	const rightCollection = randomIdentifier();
	const rightStore = randomIdentifier();
	const foreignSortField = randomIdentifier();

	const nestedSortSample: AbstractQueryNodeSort =
	{
		type: 'sort',
		direction: 'ascending',
		target: {
			type: 'nested-one-target',
			field: {
				type: 'primitive',
				field: foreignSortField,
			},
			meta: {
				type: 'm2o',
				join: {
					local: {
						fields: [leftIdField],
					},
					foreign: {
						store: rightStore,
						collection: rightCollection,
						fields: [rightIdField],
					}
				}
			}
		}
	};

	const mock: TargetConversionResult = {
		value: {
			type: 'primitive',
			table: rightCollection,
			column: foreignSortField,
		},
		joins: [{
			type: 'join',
			table: rightCollection,
			as: rightStore + 'RANDOM',
			on: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-field',
					target: {
						type: 'primitive',
						table: rightCollection,
						column: rightIdField,
					},
					operation: 'eq',
					compareTo: {
						type: 'primitive',
						table: rightStore,
						column: rightIdField,
					},
				},
			}
		}],
	};

	vi.mocked(convertTarget).mockReturnValueOnce(mock);

	const res = convertSort([nestedSortSample], localCollection, parameterIndexGenerator());

	const expected: SortConversionResult = {
		clauses: {
			joins: mock.joins,
			order: [
				{
					type: 'order',
					orderBy: mock.value,
					direction: 'ASC',
				},
			],
		},
	};

	expect(res).toStrictEqual(expected);
});
