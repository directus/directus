import type { AbstractQueryFieldNodeRelationalOneToMany } from '@directus/data';
import { expect, test } from 'vitest';
import { getNestedMany } from './create-nested-manys.js';
import type { AbstractSqlNestedMany, AbstractSqlQuery } from '../../index.js';
import { randomIdentifier } from '@directus/random';
import { parameterIndexGenerator } from '../param-index-generator.js';
import type { Result } from './fields.js';

test('getNestedMany wit a single identifier column', () => {
	const localIdField = randomIdentifier();
	const foreignIdField = randomIdentifier();
	const foreignIdFieldId = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();
	const randomPkValue = randomIdentifier();

	const fieldMeta: AbstractQueryFieldNodeRelationalOneToMany = {
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
	};

	const idxGen = parameterIndexGenerator();

	const nestedResult: Result = {
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

	const result = getNestedMany(fieldMeta, nestedResult, idxGen, foreignTable);

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

test('getNestedMany with a multiple identifier columns (composite keys)', () => {
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

	const fieldMeta: AbstractQueryFieldNodeRelationalOneToMany = {
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
	};

	const idxGen = parameterIndexGenerator();

	const nestedResult: Result = {
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

	const result = getNestedMany(fieldMeta, nestedResult, idxGen, foreignTable);

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
