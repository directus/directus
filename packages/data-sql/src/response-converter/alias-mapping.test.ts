import { expect, test } from 'vitest';
import { mapAliasesToNestedPaths } from './alias-mapping.js';
import type { AbstractQueryFieldNode } from '@directus/data';
import type { AbstractSqlQuerySelectNode } from '../types/nodes/primitive.js';
import { randomIdentifier } from '@directus/random';
import type { AbstractSqlQueryFnNode, AbstractSqlQueryJoinNode } from '../index.js';

test('alias map for primitives only', () => {
	const randomTable1 = randomIdentifier();
	const randomPrimitiveField1 = randomIdentifier();
	const randomPrimitiveField2 = randomIdentifier();
	const randomAlias1 = randomIdentifier();
	const randomAlias2 = randomIdentifier();

	const abstractQueryNodes: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: randomPrimitiveField1,
		},
		{
			type: 'primitive',
			field: randomPrimitiveField2,
		},
	];

	const abstractSqlQueryNodes: AbstractSqlQuerySelectNode[] = [
		{
			type: 'primitive',
			table: randomTable1,
			column: randomPrimitiveField1,
			as: randomAlias1,
		},
		{
			type: 'primitive',
			table: randomTable1,
			column: randomPrimitiveField2,
			as: randomAlias2,
		},
	];

	const res = mapAliasesToNestedPaths(randomTable1, abstractQueryNodes, abstractSqlQueryNodes, []);

	expect(res).toEqual(
		new Map([
			[randomAlias1, [randomPrimitiveField1]],
			[randomAlias2, [randomPrimitiveField2]],
		])
	);
});

test('alias map for primitive with user specified alias', () => {
	const abstractQueryNodes: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: 'randomPrimitiveField1',
			alias: 'userAlias1',
		},
	];

	const abstractSqlQueryNodes: AbstractSqlQuerySelectNode[] = [
		{
			type: 'primitive',
			table: 'randomTable1',
			column: 'randomPrimitiveField1',
			as: 'randomAlias1',
			alias: 'userAlias1',
		},
	];

	const res = mapAliasesToNestedPaths('randomTable1', abstractQueryNodes, abstractSqlQueryNodes, []);

	expect(res).toEqual(new Map([['randomAlias1', ['userAlias1']]]));
});

test('alias map for a function', () => {
	const abstractQueryNodes: AbstractQueryFieldNode[] = [
		{
			type: 'fn',
			field: 'randomPrimitiveField1',
			fn: {
				type: 'extractFn',
				fn: 'year',
			},
		},
	];

	const abstractSqlQueryNodes: AbstractSqlQueryFnNode[] = [
		{
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'year',
			},
			table: 'randomTable1',
			column: 'randomPrimitiveField1',
			as: 'randomAlias1',
		},
	];

	const res = mapAliasesToNestedPaths('randomTable1', abstractQueryNodes, abstractSqlQueryNodes, []);

	expect(res).toEqual(new Map([['randomAlias1', ['randomPrimitiveField1']]]));
});

test('alias map for one m2o with an user alias on one field', () => {
	const abstractQueryNodes: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: 'primitiveField1',
		},
		{
			type: 'm2o',
			join: {
				current: {
					fields: ['joinCurrentField'],
				},
				external: {
					store: 'externalStore',
					collection: 'externalCollection',
					fields: ['externalField'],
				},
			},
			nodes: [
				{
					type: 'primitive',
					field: 'joinNodeField1',
					alias: 'userAlias',
				},
				{
					type: 'primitive',
					field: 'joinNodeField2',
				},
				// {
				// 	type: 'fn',
				// 	fn: 'year',
				// 	targetNode: {
				// 		type: 'primitive',
				// 		field: randomJoinNodeField,
				// 	},
				// },
			],
		},
	];

	const abstractSqlQueryNodes: (AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode)[] = [
		{
			type: 'primitive',
			table: 'table1',
			column: 'primitiveField1',
			as: 'alias1',
		},
		{
			type: 'primitive',
			table: 'generatedJoinAlias',
			column: 'joinNodeField1',
			as: 'alias2',
			alias: 'userAlias',
		},
		{
			type: 'primitive',
			table: 'generatedJoinAlias',
			column: 'joinNodeField2',
			as: 'alias3',
		},
		// {
		// 	type: 'fn',
		// 	fn: 'year',
		// 	field: {
		// 		type: 'primitive',
		// 		table: randomExternalCollection,
		// 		column: randomJoinNodeField,
		// 	},
		// 	as: randomAlias3,
		// },
	];

	const abstractSqlJoins: AbstractSqlQueryJoinNode[] = [
		{
			type: 'join',
			table: 'externalCollection',
			on: {
				type: 'condition',
				condition: {
					type: 'condition-field',
					target: {
						type: 'primitive',
						table: 'table1',
						column: 'joinCurrentField',
					},
					operation: 'eq',
					compareTo: {
						type: 'primitive',
						table: 'externalCollection',
						column: 'externalField',
					},
				},
				negate: false,
			},
			as: 'generatedJoinAlias',
		},
	];

	const res = mapAliasesToNestedPaths('table1', abstractQueryNodes, abstractSqlQueryNodes, abstractSqlJoins);

	expect(res).toEqual(
		new Map([
			['alias1', ['primitiveField1']],
			['alias2', ['externalCollection', 'userAlias']],
			['alias3', ['externalCollection', 'joinNodeField2']],
		])
	);
});

test('alias map for nested m2o', () => {
	const abstractQueryNodes: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: 'primitiveField1',
		},
		{
			type: 'm2o',
			join: {
				current: {
					fields: ['joinCurrentField'],
				},
				external: {
					store: 'externalStore',
					collection: 'externalCollection',
					fields: ['externalField'],
				},
			},
			nodes: [
				{
					type: 'primitive',
					field: 'joinNodeField1',
				},
				{
					type: 'primitive',
					field: 'joinNodeField2',
				},
				{
					type: 'm2o',
					join: {
						current: {
							fields: ['nestedJoinCurrentField'],
						},
						external: {
							store: 'nestedExternalStore',
							collection: 'nestedExternalCollection',
							fields: ['nestedExternalField'],
						},
					},
					nodes: [
						{
							type: 'primitive',
							field: 'nestedJoinNodeField1',
						},
						{
							type: 'primitive',
							field: 'nestedJoinNodeField2',
						},
					],
				},
			],
		},
	];

	const abstractSqlQueryNodes: (AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode)[] = [
		{
			type: 'primitive',
			table: 'table1',
			column: 'primitiveField1',
			as: 'alias1',
		},
		{
			type: 'primitive',
			table: 'generatedJoinAlias',
			column: 'joinNodeField1',
			as: 'alias2',
		},
		{
			type: 'primitive',
			table: 'generatedJoinAlias',
			column: 'joinNodeField2',
			as: 'alias3',
		},
		{
			type: 'primitive',
			table: 'nestedGeneratedJoinAlias',
			column: 'nestedJoinNodeField1',
			as: 'alias4',
		},
		{
			type: 'primitive',
			table: 'nestedGeneratedJoinAlias',
			column: 'nestedJoinNodeField2',
			as: 'alias5',
		},
	];

	const abstractSqlJoins: AbstractSqlQueryJoinNode[] = [
		{
			type: 'join',
			table: 'externalCollection',
			on: {
				type: 'condition',
				condition: {
					type: 'condition-field',
					target: {
						type: 'primitive',
						table: 'table1',
						column: 'joinCurrentField',
					},
					operation: 'eq',
					compareTo: {
						type: 'primitive',
						table: 'externalCollection',
						column: 'externalField',
					},
				},
				negate: false,
			},
			as: 'generatedJoinAlias',
		},
		{
			type: 'join',
			table: 'nestedExternalCollection',
			on: {
				type: 'condition',
				condition: {
					type: 'condition-field',
					target: {
						type: 'primitive',
						table: 'externalCollection',
						column: 'externalField',
					},
					operation: 'eq',
					compareTo: {
						type: 'primitive',
						table: 'nestedExternalCollection',
						column: 'externalField',
					},
				},
				negate: false,
			},
			as: 'nestedGeneratedJoinAlias',
		},
	];

	const res = mapAliasesToNestedPaths('table1', abstractQueryNodes, abstractSqlQueryNodes, abstractSqlJoins);

	expect(res).toEqual(
		new Map([
			['alias1', ['primitiveField1']],
			['alias2', ['externalCollection', 'joinNodeField1']],
			['alias3', ['externalCollection', 'joinNodeField2']],
			['alias4', ['externalCollection', 'nestedExternalCollection', 'nestedJoinNodeField1']],
			['alias5', ['externalCollection', 'nestedExternalCollection', 'nestedJoinNodeField2']],
		])
	);
});
