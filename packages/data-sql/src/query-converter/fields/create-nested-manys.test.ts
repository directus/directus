import type { AbstractQueryFieldNodeNestedMany } from '@directus/data';
import { expect, test } from 'vitest';
import { getNestedMany } from './create-nested-manys.js';
import type { AbstractSqlNestedMany, AbstractSqlQuery } from '../../index.js';
import { randomIdentifier } from '@directus/random';
import { parameterIndexGenerator } from '../param-index-generator.js';
import type { FieldConversionResult } from './fields.js';

test('getNestedMany with a single identifier', () => {
	const localIdField = randomIdentifier();
	const foreignIdField = randomIdentifier();
	const foreignIdFieldId = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();
	const randomPkValue = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedMany = {
		type: 'nested-many',
		fields: [
			{
				type: 'primitive',
				field: foreignIdField,
			},
		],
		meta: {
			type: 'o2m',
			join: {
				local: {
					fields: [localIdField],
				},
				foreign: {
					store: foreignStore,
					collection: foreignTable,
					fields: [foreignIdField],
				},
			},
		},
	};

	const nestedResult: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: foreignTable,
					column: foreignIdField,
					as: foreignIdFieldId,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: new Map([[foreignIdFieldId, [foreignIdField]]]),
		nestedManys: [],
	};

	const result = getNestedMany(field, nestedResult, parameterIndexGenerator());

	const expected: AbstractSqlNestedMany = {
		queryGenerator: expect.any(Function),
		localJoinFields: [localIdField],
		foreignJoinFields: [foreignIdField],
		alias: foreignTable,
	};

	const expectedGeneratedQuery: AbstractSqlQuery = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: foreignTable,
					column: foreignIdField,
					as: foreignIdFieldId,
				},
			],
			from: foreignTable,
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
		parameters: [randomPkValue],
		aliasMapping: new Map([[foreignIdFieldId, [foreignIdField]]]),
		nestedManys: [],
	};

	expect(result).toStrictEqual(expected);
	expect(result.queryGenerator([randomPkValue])).toStrictEqual(expectedGeneratedQuery);
});

test('getNestedMany with a multiple identifiers (a composite key)', () => {
	const localIdField1 = randomIdentifier();
	const localIdField2 = randomIdentifier();

	// the field the user wants to be returned
	const desiredForeignField = randomIdentifier();
	const desiredForeignFieldId = randomIdentifier();

	// the foreign keys
	const foreignIdField1 = randomIdentifier();
	const foreignIdField2 = randomIdentifier();

	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();

	// the values of the local identifier fields, returned by the root query
	const randomPkValue1 = randomIdentifier();
	const randomPkValue2 = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedMany = {
		type: 'nested-many',
		fields: [
			{
				type: 'primitive',
				field: desiredForeignField,
			},
		],
		meta: {
			type: 'o2m',
			join: {
				local: {
					fields: [localIdField1, localIdField2],
				},
				foreign: {
					store: foreignStore,
					collection: foreignTable,
					fields: [foreignIdField1, foreignIdField2],
				},
			},
		},
	};

	const idxGen = parameterIndexGenerator();

	const nestedResult: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: foreignTable,
					column: desiredForeignField,
					as: desiredForeignFieldId,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: new Map([[desiredForeignFieldId, [desiredForeignField]]]),
		nestedManys: [],
	};

	const result = getNestedMany(field, nestedResult, idxGen);

	const expected: AbstractSqlNestedMany = {
		queryGenerator: expect.any(Function),
		localJoinFields: [localIdField1, localIdField2],
		foreignJoinFields: [foreignIdField1, foreignIdField2],
		alias: foreignTable,
	};

	const expectedGeneratedQuery: AbstractSqlQuery = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: foreignTable,
					column: desiredForeignField,
					as: desiredForeignFieldId,
				},
			],
			from: foreignTable,
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
		parameters: [randomPkValue1, randomPkValue2],
		aliasMapping: new Map([[desiredForeignFieldId, [desiredForeignField]]]),
		nestedManys: [],
	};

	expect(result).toStrictEqual(expected);
	expect(result.queryGenerator([randomPkValue1, randomPkValue2])).toMatchObject(expectedGeneratedQuery);
});

test.todo('getNestedMany with a single identifier and modifiers', () => {
	const localIdField = randomIdentifier();
	const foreignIdField = randomIdentifier();
	const foreignIdFieldId = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();
	const randomPkValue = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedMany = {
		type: 'nested-many',
		fields: [
			{
				type: 'primitive',
				field: foreignIdField,
			},
		],
		meta: {
			type: 'o2m',
			join: {
				local: {
					fields: [localIdField],
				},
				foreign: {
					store: foreignStore,
					collection: foreignTable,
					fields: [foreignIdField],
				},
			},
		},
	};

	const nestedResult: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: foreignTable,
					column: foreignIdField,
					as: foreignIdFieldId,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: new Map([[foreignIdFieldId, [foreignIdField]]]),
		nestedManys: [],
	};

	const result = getNestedMany(field, nestedResult, parameterIndexGenerator());

	const expected: AbstractSqlNestedMany = {
		queryGenerator: expect.any(Function),
		localJoinFields: [localIdField],
		foreignJoinFields: [foreignIdField],
		alias: foreignTable,
	};

	const expectedGeneratedQuery: AbstractSqlQuery = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: foreignTable,
					column: foreignIdField,
					as: foreignIdFieldId,
				},
			],
			from: foreignTable,
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
								column: foreignIdField,
							},
							compareTo: {
								type: 'value',
								parameterIndex: 0,
							},
						},
						negate: false,
					},
					// @TODO add user defined modifier(s)
				],
			},
		},
		parameters: [randomPkValue],
		aliasMapping: new Map([[foreignIdFieldId, [foreignIdField]]]),
		nestedManys: [],
	};

	expect(result).toStrictEqual(expected);
	expect(result.queryGenerator([randomPkValue])).toStrictEqual(expectedGeneratedQuery);
});
