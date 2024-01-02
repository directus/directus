import type { AbstractQueryFieldNodeNestedRelationalMany } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { expect, test } from 'vitest';
import type { AbstractSqlQueryJoinNode } from '../../types/index.js';
import { createJoin } from './create-join.js';

test('Convert m2o relation on single field ', () => {
	const randomCurrentCollection = randomIdentifier();
	const randomCurrentField = randomIdentifier();
	const randomExternalCollection = randomIdentifier();
	const randomExternalStore = randomIdentifier();
	const randomExternalField = randomIdentifier();
	const randomAlias = randomIdentifier();

	const node: AbstractQueryFieldNodeNestedRelationalMany = {
		type: 'relational-many',
		local: {
			fields: [randomCurrentField],
		},
		foreign: {
			store: randomExternalStore,
			collection: randomExternalCollection,
			fields: [randomExternalField],
		},
	};

	const expected: AbstractSqlQueryJoinNode = {
		type: 'join',
		table: randomExternalCollection,
		on: {
			type: 'condition',
			condition: {
				type: 'condition-field',
				target: {
					type: 'primitive',
					table: randomCurrentCollection,
					column: randomCurrentField,
				},
				operation: 'eq',
				compareTo: {
					type: 'primitive',
					table: randomAlias,
					column: randomExternalField,
				},
			},
			negate: false,
		},
		as: randomAlias,
	};

	expect(createJoin(randomCurrentCollection, node, randomAlias)).toStrictEqual(expected);
});

test('Convert m2o relation with composite keys', () => {
	const randomCurrentCollection = randomIdentifier();
	const randomCurrentField = randomIdentifier();
	const randomCurrentField2 = randomIdentifier();
	const randomExternalCollection = randomIdentifier();
	const randomExternalStore = randomIdentifier();
	const randomExternalField = randomIdentifier();
	const randomExternalField2 = randomIdentifier();
	const randomGeneratedAlias = randomIdentifier();

	const node: AbstractQueryFieldNodeNestedRelationalMany = {
		type: 'relational-many',
		local: {
			fields: [randomCurrentField, randomCurrentField2],
		},
		foreign: {
			store: randomExternalStore,
			collection: randomExternalCollection,
			fields: [randomExternalField, randomExternalField2],
		},
	};

	const expected: AbstractSqlQueryJoinNode = {
		type: 'join',
		table: randomExternalCollection,
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
							table: randomCurrentCollection,
							column: randomCurrentField,
						},
						operation: 'eq',
						compareTo: {
							type: 'primitive',
							table: randomGeneratedAlias,
							column: randomExternalField,
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
							table: randomCurrentCollection,
							column: randomCurrentField2,
						},
						operation: 'eq',
						compareTo: {
							type: 'primitive',
							table: randomGeneratedAlias,
							column: randomExternalField2,
						},
					},
					negate: false,
				},
			],
		},
		as: randomGeneratedAlias,
	};

	expect(createJoin(randomCurrentCollection, node, randomGeneratedAlias)).toStrictEqual(expected);
});
