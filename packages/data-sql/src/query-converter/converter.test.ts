import type { AbstractQuery } from '@directus/data';
import { expect, test, vi, afterEach } from 'vitest';
import type { AbstractSqlQuery, AbstractSqlQueryJoinNode } from '../types/index.js';
import { convertQuery } from './converter.js';
import { randomAlpha, randomIdentifier } from '@directus/random';
import { convertFieldNodes, type FieldConversionResult } from './fields/fields.js';
import { convertModifiers, type ModifierConversionResult } from './modifiers/modifiers.js';

vi.mock('./fields/fields.js', async (importOriginal) => {
	const mod = await importOriginal<typeof import('./fields/fields.js')>();
	return {
		...mod,
		convertFieldNodes: vi.fn(),
	};
});

vi.mock('./modifiers/modifiers.js', async (importOriginal) => {
	const mod = await importOriginal<typeof import('./modifiers/modifiers.js')>();
	return {
		...mod,
		convertModifiers: vi.fn(),
	};
});

const firstField = randomIdentifier();
const secondField = randomIdentifier();
const rootCollection = randomIdentifier();
const rootStore = randomIdentifier();

afterEach(() => {
	vi.restoreAllMocks();
});

test('Convert a query with a foreign/right string filter', () => {
	const foreignCollection = randomIdentifier();
	const targetField = randomIdentifier();
	const leftHandIdentifierField = randomIdentifier();
	const rightHandIdentifierField = randomIdentifier();
	const compareValue = randomAlpha(3);

	const sampleAbstractQuery: AbstractQuery = {
		store: rootStore,
		collection: rootCollection,
		fields: [
			{
				type: 'primitive',
				field: firstField,
				alias: randomIdentifier(),
			},
			{
				type: 'primitive',
				field: secondField,
				alias: randomIdentifier(),
			},
		],
		modifiers: {
			filter: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					target: {
						type: 'nested-one-target',
						field: {
							type: 'primitive',
							field: targetField,
						},
						nesting: {
							type: 'relational-many',
							local: {
								fields: [leftHandIdentifierField],
							},
							foreign: {
								store: rootStore,
								fields: [rightHandIdentifierField],
								collection: foreignCollection,
							},
						},
					},
					operation: 'starts_with',
					compareTo: compareValue,
				},
			},
		},
	};

	const fieldConversionResult: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
					as: `${firstField}_RANDOM`,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
					as: `${secondField}_RANDOM`,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: [],
		subQueries: [],
	};

	vi.mocked(convertFieldNodes).mockReturnValueOnce(fieldConversionResult);

	const modifierConversionResult: ModifierConversionResult = {
		clauses: {
			joins: [
				{
					type: 'join',
					table: foreignCollection,
					on: {
						type: 'condition',
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								table: foreignCollection,
								column: targetField,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								table: rootCollection,
								column: leftHandIdentifierField,
							},
						},
						negate: false,
					},
					as: `${foreignCollection}_RANDOM`,
				},
			],
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-string',
					target: {
						type: 'primitive',
						table: foreignCollection,
						column: targetField,
					},
					operation: 'starts_with',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
		},
		parameters: [compareValue],
	};

	vi.mocked(convertModifiers).mockReturnValueOnce(modifierConversionResult);
	const res = convertQuery(sampleAbstractQuery);

	const expected: Required<Pick<AbstractSqlQuery, 'clauses' | 'parameters'>> = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
					as: `${firstField}_RANDOM`,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
					as: `${secondField}_RANDOM`,
				},
			],
			from: rootCollection,
			joins: [
				{
					type: 'join',
					table: foreignCollection,
					on: {
						type: 'condition',
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								table: foreignCollection,
								column: targetField,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								table: rootCollection,
								column: leftHandIdentifierField,
							},
						},
						negate: false,
					},
					as: `${foreignCollection}_RANDOM`,
				},
			],
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-string',
					target: {
						type: 'primitive',
						table: foreignCollection,
						column: targetField,
					},
					operation: 'starts_with',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
		},
		parameters: [compareValue],
	};

	expect(res.rootQuery.clauses).toStrictEqual(expected.clauses);
	expect(res.rootQuery.parameters).toStrictEqual(expected.parameters);
});

test('Convert a query with a nested field and filtering on that nested field.', () => {
	const foreignCollection = randomIdentifier();
	const targetField = randomIdentifier();
	const leftHandIdentifierField = randomIdentifier();
	const rightHandIdentifierField = randomIdentifier();
	const compareValue = randomAlpha(3);

	const sampleAbstractQuery: AbstractQuery = {
		store: rootStore,
		collection: rootCollection,
		fields: [
			{
				type: 'primitive',
				field: firstField,
				alias: randomIdentifier(),
			},
			{
				type: 'nested-single-one',
				fields: [
					{
						type: 'primitive',
						field: secondField,
						alias: randomIdentifier(),
					},
				],
				alias: randomIdentifier(),
				nesting: {
					type: 'relational-many',
					local: {
						fields: [leftHandIdentifierField],
					},
					foreign: {
						store: rootStore,
						fields: [rightHandIdentifierField],
						collection: foreignCollection,
					},
				},
			},
		],
		modifiers: {
			filter: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					target: {
						type: 'nested-one-target',
						field: {
							type: 'primitive',
							field: targetField,
						},
						nesting: {
							type: 'relational-many',
							local: {
								fields: [leftHandIdentifierField],
							},
							foreign: {
								store: rootStore,
								fields: [rightHandIdentifierField],
								collection: foreignCollection,
							},
						},
					},
					operation: 'starts_with',
					compareTo: compareValue,
				},
			},
		},
	};

	// this is used in the result of the field conversion as well as in the result of the modifier conversion
	const joinNode: AbstractSqlQueryJoinNode = {
		type: 'join',
		table: foreignCollection,
		on: {
			type: 'condition',
			condition: {
				type: 'condition-field',
				target: {
					type: 'primitive',
					table: foreignCollection,
					column: targetField,
				},
				operation: 'eq',
				compareTo: {
					type: 'primitive',
					table: rootCollection,
					column: leftHandIdentifierField,
				},
			},
			negate: false,
		},
		as: `${foreignCollection}_RANDOM`,
	};

	const fieldConversionResult: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
					as: `${firstField}_RANDOM`,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
					as: `${secondField}_RANDOM`,
				},
			],
			joins: [joinNode],
		},
		parameters: [],
		aliasMapping: [],
		subQueries: [],
	};

	vi.mocked(convertFieldNodes).mockReturnValueOnce(fieldConversionResult);

	const modifierConversionResult: ModifierConversionResult = {
		clauses: {
			joins: [joinNode],
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-string',
					target: {
						type: 'primitive',
						table: foreignCollection,
						column: targetField,
					},
					operation: 'starts_with',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
		},
		parameters: [compareValue],
	};

	vi.mocked(convertModifiers).mockReturnValueOnce(modifierConversionResult);
	const res = convertQuery(sampleAbstractQuery);

	const expected: Required<Pick<AbstractSqlQuery, 'clauses' | 'parameters'>> = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
					as: `${firstField}_RANDOM`,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
					as: `${secondField}_RANDOM`,
				},
			],
			from: rootCollection,
			joins: [
				{
					type: 'join',
					table: foreignCollection,
					on: {
						type: 'condition',
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								table: foreignCollection,
								column: targetField,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								table: rootCollection,
								column: leftHandIdentifierField,
							},
						},
						negate: false,
					},
					as: `${foreignCollection}_RANDOM`,
				},
				{
					type: 'join',
					table: foreignCollection,
					on: {
						type: 'condition',
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								table: foreignCollection,
								column: targetField,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								table: rootCollection,
								column: leftHandIdentifierField,
							},
						},
						negate: false,
					},
					as: `${foreignCollection}_RANDOM`,
				},
			],
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-string',
					target: {
						type: 'primitive',
						table: foreignCollection,
						column: targetField,
					},
					operation: 'starts_with',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
		},
		parameters: [compareValue],
	};

	expect(res.rootQuery.clauses).toStrictEqual(expected.clauses);
});
