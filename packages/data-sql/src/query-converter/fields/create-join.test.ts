import type { AbstractQueryFieldNodeNestedRelationalMany } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import type { AbstractSqlQueryJoinNode } from '../../types/index.js';
import { createJoin } from './create-join.js';

test('Convert m2o relation on single field ', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();

	const externalStore = randomIdentifier();
	const externalTableName = randomIdentifier();
	const externalTableIndex = randomInteger(0, 100);
	const externalColumnName = randomIdentifier();

	const relationalField: AbstractQueryFieldNodeNestedRelationalMany = {
		type: 'relational-many',
		local: {
			fields: [columnName],
		},
		foreign: {
			store: externalStore,
			collection: externalTableName,
			fields: [externalColumnName],
		},
	};

	const expectedResult: AbstractSqlQueryJoinNode = {
		type: 'join',
		tableName: externalTableName,
		tableIndex: externalTableIndex,
		on: {
			type: 'condition',
			condition: {
				type: 'condition-field',
				target: {
					type: 'primitive',
					tableIndex,
					columnName,
				},
				operation: 'eq',
				compareTo: {
					type: 'primitive',
					tableIndex: externalTableIndex,
					columnName: externalColumnName,
				},
			},
			negate: false,
		},
	};

	const result = createJoin(relationalField, tableIndex, externalTableIndex);

	expect(result).toStrictEqual(expectedResult);
});

test('Convert m2o relation with composite keys', () => {
	const tableIndex = randomInteger(0, 100);
	const column1Name = randomIdentifier();
	const column2Name = randomIdentifier();

	const externalStore = randomIdentifier();
	const externalTableName = randomIdentifier();
	const externalTableIndex = randomInteger(0, 100);
	const externalColumn1Name = randomIdentifier();
	const externalColumn2Name = randomIdentifier();

	const relationalField: AbstractQueryFieldNodeNestedRelationalMany = {
		type: 'relational-many',
		local: {
			fields: [column1Name, column2Name],
		},
		foreign: {
			store: externalStore,
			collection: externalTableName,
			fields: [externalColumn1Name, externalColumn2Name],
		},
	};

	const expectedResult: AbstractSqlQueryJoinNode = {
		type: 'join',
		tableName: externalTableName,
		tableIndex: externalTableIndex,
		on: {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: [
				{
					type: 'condition',
					condition: {
						type: 'condition-field',
						target: {
							type: 'primitive',
							tableIndex: tableIndex,
							columnName: column1Name,
						},
						operation: 'eq',
						compareTo: {
							type: 'primitive',
							tableIndex: externalTableIndex,
							columnName: externalColumn1Name,
						},
					},
					negate: false,
				},
				{
					type: 'condition',
					condition: {
						type: 'condition-field',
						target: {
							type: 'primitive',
							tableIndex: tableIndex,
							columnName: column2Name,
						},
						operation: 'eq',
						compareTo: {
							type: 'primitive',
							tableIndex: externalTableIndex,
							columnName: externalColumn2Name,
						},
					},
					negate: false,
				},
			],
		},
	};

	const result = createJoin(relationalField, tableIndex, externalTableIndex);

	expect(result).toStrictEqual(expectedResult);
});
