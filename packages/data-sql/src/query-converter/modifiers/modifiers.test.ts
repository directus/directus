import { expect, test, vi } from 'vitest';
import { convertModifiers, type ModifierConversionResult } from './modifiers.js';
import type { AbstractQueryModifiers } from '@directus/data';
import { convertFilter } from './filter/filter.js';
import { parameterIndexGenerator } from '../param-index-generator.js';
import { randomIdentifier, randomInteger } from '@directus/random';
import type { AbstractSqlQueryJoinNode } from '../../index.js';
import { convertSort, type SortConversionResult } from './sort.js';
import type { FilterResult } from './filter/utils.js';

vi.mock('./filter/filter.js', (importOriginal) => {
	const mod = importOriginal();
	return {
		...mod,
		convertFilter: vi.fn(),
	};
});

vi.mock('./sort.js', (importOriginal) => {
	const mod = importOriginal();
	return {
		...mod,
		convertSort: vi.fn(),
	};
});

test('Convert primitive filter', () => {
	const sample = {
		filter: {
			type: 'condition',
			condition: {
				/**... */
			},
		},
	} as AbstractQueryModifiers;

	const filterConversionMock: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-number',
					operation: 'lt',
					target: {
						type: 'primitive',
						column: randomIdentifier(),
						table: randomIdentifier(),
					},
					compareTo: { type: 'value', parameterIndex: 0 },
				},
			},
			joins: [],
		},
		parameters: [randomInteger(0, 100)],
	};

	vi.mocked(convertFilter).mockReturnValueOnce(filterConversionMock);
	const randomCollection = randomIdentifier();

	const res = convertModifiers(sample, randomCollection, parameterIndexGenerator());

	const expected: ModifierConversionResult = {
		clauses: {
			where: filterConversionMock.clauses.where,
		},
		parameters: filterConversionMock.parameters,
	};

	expect(res).toStrictEqual(expected);
});

test('Convert nested, primitive filter', () => {
	const compareTo = randomInteger(0, 100);

	const sample = {
		filter: {
			type: 'condition',
			condition: {
				/**... */
			},
		},
	} as AbstractQueryModifiers;

	const filterConversionMock: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-number',
					operation: 'lt',
					target: {
						type: 'primitive',
						column: randomIdentifier(),
						table: randomIdentifier(),
					},
					compareTo: { type: 'value', parameterIndex: 0 },
				},
			},
			// in case of nested filter, a join clause is returned as well from the filter module
			joins: [
				{
					type: 'join',
					/*... */
				} as AbstractSqlQueryJoinNode,
			],
		},
		parameters: [compareTo],
	};

	vi.mocked(convertFilter).mockReturnValueOnce(filterConversionMock);
	const randomCollection = randomIdentifier();

	const res = convertModifiers(sample, randomCollection, parameterIndexGenerator());

	const expected: ModifierConversionResult = {
		clauses: {
			joins: filterConversionMock.clauses.joins,
			where: filterConversionMock.clauses.where,
		},
		parameters: filterConversionMock.parameters,
	};

	expect(res).toStrictEqual(expected);
});

test('Convert nested sort', () => {
	const sampleModifiers = { sort: {} } as AbstractQueryModifiers;

	const sortConversionMock: SortConversionResult = {
		clauses: {
			order: [
				{
					type: 'order',
					direction: 'ASC',
					orderBy: {
						type: 'primitive',
						column: randomIdentifier(),
						table: randomIdentifier(),
					},
				},
			],
			// in case of nested filter, a join clause is returned as well from the filter module
			joins: [
				{
					type: 'join',
					/*... */
				} as AbstractSqlQueryJoinNode,
			],
		},
	};

	vi.mocked(convertSort).mockReturnValueOnce(sortConversionMock);
	const randomCollection = randomIdentifier();

	const res = convertModifiers(sampleModifiers, randomCollection, parameterIndexGenerator());

	const expected: ModifierConversionResult = {
		clauses: {
			joins: sortConversionMock.clauses.joins,
			order: sortConversionMock.clauses.order,
		},
		parameters: [],
	};

	expect(res).toStrictEqual(expected);
});
