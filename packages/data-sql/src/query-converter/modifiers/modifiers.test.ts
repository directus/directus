import { expect, test, vi } from 'vitest';
import { convertModifiers, type ModifierConversionResult } from './modifiers.js';
import type { AbstractQueryModifiers } from '@directus/data';
import { convertFilter, type FilterResult } from './filter/filter.js';
import { parameterIndexGenerator } from '../param-index-generator.js';
import { randomIdentifier, randomInteger } from '@directus/random';
import type { AbstractSqlQueryJoinNode } from '../../index.js';

vi.mock('./filter/filter.js', (importOriginal) => {
	const mod = importOriginal();
	return {
		...mod,
		convertFilter: vi.fn(),
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
			joins: [],
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
