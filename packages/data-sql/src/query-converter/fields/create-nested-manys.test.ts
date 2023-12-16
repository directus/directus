import type { AbstractQueryFieldNodeNestedSingleMany } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { afterAll, expect, test, vi } from 'vitest';
import type { ConverterResult } from '../../index.js';
import { getNestedMany, type NestedManyResult } from './create-nested-manys.js';

afterAll(() => {
	vi.restoreAllMocks();
});

vi.mock('../../utils/create-unique-alias.js', () => ({
	createUniqueAlias: vi.fn().mockImplementation((i) => `${i}_RANDOM`),
}));

test('getNestedMany with a single identifier', () => {
	const collection = randomIdentifier();
	const localIdField = randomIdentifier();
	const foreignIdField = randomIdentifier();
	const foreignIdFieldAlias = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();
	const randomValue = randomIdentifier();
	const manyAlias = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedSingleMany = {
		type: 'nested-single-many',
		fields: [
			{
				type: 'primitive',
				field: foreignIdField,
				alias: foreignIdFieldAlias,
			},
		],
		nesting: {
			type: 'relational-many',
			local: {
				fields: [localIdField],
			},
			foreign: {
				store: foreignStore,
				collection: foreignTable,
				fields: [foreignIdField],
			},
		},
		alias: manyAlias,
		modifiers: {},
	};

	const result = getNestedMany(collection, field);

	const expected: NestedManyResult = {
		subQuery: expect.any(Function),
		select: [
			{
				type: 'primitive',
				table: collection,
				column: localIdField,
				as: `${localIdField}_RANDOM`,
			},
		],
	};

	const rootRow = { [`${localIdField}_RANDOM`]: randomValue };

	const expectedGeneratedQuery: ConverterResult = {
		rootQuery: {
			clauses: {
				select: [
					{
						type: 'primitive',
						table: foreignTable,
						column: foreignIdField,
						as: `${foreignIdField}_RANDOM`,
					},
				],
				from: foreignTable,
				joins: [],
				where: {
					type: 'condition',
					condition: {
						type: 'condition-string',
						operation: 'eq',
						target: {
							type: 'primitive',
							table: foreignTable,
							column: foreignIdField,
						},
						compareTo: {
							type: 'value',
							parameterIndex: 0,
						},
					},
					negate: false,
				},
			},
			parameters: [randomValue],
		},
		subQueries: [],
		aliasMapping: [{ type: 'root', alias: foreignIdFieldAlias, column: `${foreignIdField}_RANDOM` }],
	};

	expect(result).toStrictEqual(expected);
	expect(result.subQuery(rootRow)).toStrictEqual(expectedGeneratedQuery);
});

test('getNestedMany with a multiple identifiers (a composite key)', () => {
	const collection = randomIdentifier();
	const foreignIdField = randomIdentifier();
	const foreignIdFieldAlias = randomIdentifier();
	const randomValue1 = randomIdentifier();
	const randomValue2 = randomIdentifier();
	const localIdField1 = randomIdentifier();
	const localIdField2 = randomIdentifier();
	const foreignIdField1 = randomIdentifier();
	const foreignIdField2 = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();
	const manyAlias = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedSingleMany = {
		type: 'nested-single-many',
		fields: [
			{
				type: 'primitive',
				field: foreignIdField,
				alias: foreignIdFieldAlias,
			},
		],
		nesting: {
			type: 'relational-many',
			local: {
				fields: [localIdField1, localIdField2],
			},
			foreign: {
				store: foreignStore,
				collection: foreignTable,
				fields: [foreignIdField1, foreignIdField2],
			},
		},
		modifiers: {},
		alias: manyAlias,
	};

	const result = getNestedMany(collection, field);

	const expected: NestedManyResult = {
		subQuery: expect.any(Function),
		select: [
			{
				type: 'primitive',
				table: collection,
				column: localIdField1,
				as: `${localIdField1}_RANDOM`,
			},
			{
				type: 'primitive',
				table: collection,
				column: localIdField2,
				as: `${localIdField2}_RANDOM`,
			},
		],
	};

	const rootRow = { [`${localIdField1}_RANDOM`]: randomValue1, [`${localIdField2}_RANDOM`]: randomValue2 };

	const expectedGeneratedQuery: ConverterResult = {
		rootQuery: {
			clauses: {
				select: [
					{
						type: 'primitive',
						table: foreignTable,
						column: foreignIdField,
						as: `${foreignIdField}_RANDOM`,
					},
				],
				from: foreignTable,
				joins: [],
				where: {
					type: 'logical',
					operator: 'and',
					negate: false,
					childNodes: [
						{
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'eq',
								target: {
									type: 'primitive',
									table: foreignTable,
									column: foreignIdField1,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 0,
								},
							},
							negate: false,
						},
						{
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'eq',
								target: {
									type: 'primitive',
									table: foreignTable,
									column: foreignIdField2,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 1,
								},
							},
							negate: false,
						},
					],
				},
			},
			parameters: [randomValue1, randomValue2],
		},
		subQueries: [],
		aliasMapping: [{ type: 'root', alias: foreignIdFieldAlias, column: `${foreignIdField}_RANDOM` }],
	};

	expect(result).toStrictEqual(expected);
	expect(result.subQuery(rootRow)).toStrictEqual(expectedGeneratedQuery);
});

test('getNestedMany with modifiers', () => {
	const localIdField = randomIdentifier();
	const foreignIdField = randomIdentifier();
	const foreignIdFieldAlias = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();
	const randomPkValue = randomIdentifier();
	const randomCompareValue = randomIdentifier();
	const randomLimit = randomInteger(1, 100);
	const manyAlias = randomIdentifier();
	const collection = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedSingleMany = {
		type: 'nested-single-many',
		fields: [
			{
				type: 'primitive',
				field: foreignIdField,
				alias: foreignIdFieldAlias,
			},
		],
		nesting: {
			type: 'relational-many',
			local: {
				fields: [localIdField],
			},
			foreign: {
				store: foreignStore,
				collection: foreignTable,
				fields: [foreignIdField],
			},
		},
		modifiers: {
			filter: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					operation: 'starts_with',
					target: {
						type: 'primitive',
						field: foreignIdField,
					},
					compareTo: randomCompareValue,
				},
			},
			limit: {
				type: 'limit',
				value: randomLimit,
			},
			sort: [
				{
					type: 'sort',
					direction: 'ascending',
					target: {
						type: 'primitive',
						field: foreignIdField,
					},
				},
			],
		},
		alias: manyAlias,
	};

	const result = getNestedMany(collection, field);

	const expected: NestedManyResult = {
		subQuery: expect.any(Function),
		select: [
			{
				type: 'primitive',
				table: collection,
				column: localIdField,
				as: `${localIdField}_RANDOM`,
			},
		],
	};

	const rootRow = { [`${localIdField}_RANDOM`]: randomPkValue, [`${foreignIdField}_RANDOM`]: randomCompareValue };

	const expectedGeneratedQuery: ConverterResult = {
		rootQuery: {
			clauses: {
				select: [
					{
						type: 'primitive',
						table: foreignTable,
						column: foreignIdField,
						as: `${foreignIdField}_RANDOM`,
					},
				],
				from: foreignTable,
				joins: [],
				where: {
					type: 'logical',
					operator: 'and',
					negate: false,
					childNodes: [
						{
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'starts_with',
								target: {
									type: 'primitive',
									table: foreignTable,
									column: foreignIdField,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 0,
								},
							},
							negate: false,
						},
						{
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'eq',
								target: {
									type: 'primitive',
									table: foreignTable,
									column: foreignIdField,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 2,
								},
							},
							negate: false,
						},
					],
				},
				limit: {
					type: 'value',
					parameterIndex: 1,
				},
				order: [
					{
						type: 'order',
						orderBy: {
							type: 'primitive',
							table: foreignTable,
							column: foreignIdField,
						},
						direction: 'ASC',
					},
				],
			},

			parameters: [randomCompareValue, randomLimit, randomPkValue],
		},
		subQueries: [],
		aliasMapping: [{ type: 'root', alias: foreignIdFieldAlias, column: `${foreignIdField}_RANDOM` }],
	};

	expect(result).toStrictEqual(expected);
	expect(result.subQuery(rootRow)).toStrictEqual(expectedGeneratedQuery);
});

test('getNestedMany with nested modifiers', () => {
	const randomJoinCurrentField = randomIdentifier();
	const randomExternalCollection = randomIdentifier();
	const randomExternalStore = randomIdentifier();
	const randomExternalField = randomIdentifier();
	const randomJoinNodeField = randomIdentifier();
	const randomJoinNodeFieldAlias = randomIdentifier();
	const randomNestedAlias = randomIdentifier();
	const nestedJoinCurrentField = randomIdentifier();
	const nestedExternalStore = randomIdentifier();
	const nestedExternalCollection = randomIdentifier();
	const nestedForeignIdFields = randomIdentifier();
	const randomLimit = randomInteger(1, 100);
	const compareValue = randomIdentifier();
	const nestedTargetField = randomIdentifier();
	const collection = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedSingleMany = {
		type: 'nested-single-many',
		fields: [
			{
				type: 'primitive',
				field: randomJoinNodeField,
				alias: randomJoinNodeFieldAlias,
			},
		],
		alias: randomNestedAlias,
		nesting: {
			type: 'relational-many',
			local: {
				fields: [randomJoinCurrentField],
			},
			foreign: {
				store: randomExternalStore,
				collection: randomExternalCollection,
				fields: [randomExternalField],
			},
		},
		modifiers: {
			filter: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					operation: 'starts_with',
					target: {
						type: 'nested-one-target',
						field: {
							type: 'primitive',
							field: nestedTargetField,
						},
						nesting: {
							type: 'relational-many',
							local: {
								fields: [nestedJoinCurrentField],
							},
							foreign: {
								store: nestedExternalStore,
								collection: nestedExternalCollection,
								fields: [nestedForeignIdFields],
							},
						},
					},
					compareTo: compareValue,
				},
			},
			limit: {
				type: 'limit',
				value: randomLimit,
			},
		},
	};

	const result = getNestedMany(collection, field);

	const expected: NestedManyResult = {
		subQuery: expect.any(Function),
		select: [
			{
				type: 'primitive',
				table: collection,
				column: randomJoinCurrentField,
				as: `${randomJoinCurrentField}_RANDOM`,
			},
		],
	};

	expect(result).toStrictEqual(expected);
	const randomPkValue = randomIdentifier();

	const expectedGeneratedQuery: ConverterResult = {
		rootQuery: {
			clauses: {
				select: [
					{
						type: 'primitive',
						table: randomExternalCollection,
						column: randomJoinNodeField,
						as: `${randomJoinNodeField}_RANDOM`,
					},
				],
				from: randomExternalCollection,
				joins: [
					{
						type: 'join',
						table: nestedExternalCollection,
						as: `${nestedExternalCollection}_RANDOM`,
						on: {
							type: 'condition',
							condition: {
								type: 'condition-field',
								compareTo: {
									type: 'primitive',
									column: nestedForeignIdFields,
									table: `${nestedExternalCollection}_RANDOM`,
								},
								operation: 'eq',
								target: {
									type: 'primitive',
									column: nestedJoinCurrentField,
									table: randomExternalCollection,
								},
							},
							negate: false,
						},
					},
				],
				where: {
					type: 'logical',
					operator: 'and',
					negate: false,
					childNodes: [
						{
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'starts_with',
								target: {
									type: 'primitive',
									table: `${nestedExternalCollection}_RANDOM`,
									column: nestedTargetField,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 0,
								},
							},
							negate: false,
						},
						{
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'eq',
								target: {
									type: 'primitive',
									table: randomExternalCollection,
									column: randomExternalField,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 2,
								},
							},
							negate: false,
						},
					],
				},
				limit: {
					type: 'value',
					parameterIndex: 1,
				},
			},
			parameters: [compareValue, randomLimit, randomPkValue],
		},
		subQueries: [],
		aliasMapping: [
			{
				type: 'root',
				alias: randomJoinNodeFieldAlias,
				column: `${randomJoinNodeField}_RANDOM`,
			},
		],
	};

	const rootResultRow = { [`${randomJoinCurrentField}_RANDOM`]: randomPkValue };

	expect(result.subQuery(rootResultRow)).toStrictEqual(expectedGeneratedQuery);
});
