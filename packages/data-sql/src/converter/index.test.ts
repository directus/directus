import type { AbstractQuery, AbstractQueryFieldNodePrimitive, AbstractQueryNodeCondition } from '@directus/data';
import { beforeEach, expect, test } from 'vitest';
import type { AbstractSqlQuery } from '../types.js';
import { convertAbstractQueryToAbstractSqlQuery } from './index.js';
import { randomIdentifier, randomInteger } from '@directus/random';

let sample: {
	query: AbstractQuery;
};

beforeEach(() => {
	sample = {
		query: {
			root: true,
			store: randomIdentifier(),
			collection: randomIdentifier(),
			nodes: [
				{
					type: 'primitive',
					field: randomIdentifier(),
				},
				{
					type: 'primitive',
					field: randomIdentifier(),
				},
			],
		},
	};
});

test('Convert simple query', () => {
	const res = convertAbstractQueryToAbstractSqlQuery(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
		],
		from: sample.query.collection,
		parameters: [],
	};

	expect(res).toStrictEqual(expected);
});

test('Convert query with filter', () => {
	sample.query.modifiers = {
		filter: {
			type: 'condition',
			target: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			operation: 'gt',
			values: [randomInteger(1, 100)],
			negation: false,
		},
	};

	const res = convertAbstractQueryToAbstractSqlQuery(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
		],
		from: sample.query.collection,
		where: {
			type: 'condition',
			target: {
				column: (
					(sample.query.modifiers.filter as AbstractQueryNodeCondition).target as AbstractQueryFieldNodePrimitive
				).field,
				table: sample.query.collection,
				type: 'primitive',
			},
			negation: false,
			operation: 'gt',
			parameterIndexes: [0],
		},
		parameters: (sample.query.modifiers.filter! as AbstractQueryNodeCondition).values,
	};

	expect(res).toStrictEqual(expected);
});

test('Convert query with a limit', () => {
	sample.query.modifiers = {
		limit: {
			type: 'limit',
			value: randomInteger(1, 100),
		},
	};

	const res = convertAbstractQueryToAbstractSqlQuery(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
		],
		from: sample.query.collection,
		limit: { parameterIndex: 0 },
		parameters: [sample.query.modifiers.limit!.value],
	};

	expect(res).toStrictEqual(expected);
});

test('Convert query with limit and offset', () => {
	sample.query.modifiers = {
		limit: {
			type: 'limit',
			value: randomInteger(1, 100),
		},
		offset: {
			type: 'offset',
			value: randomInteger(1, 100),
		},
	};

	const res = convertAbstractQueryToAbstractSqlQuery(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
		],
		from: sample.query.collection,
		limit: { parameterIndex: 0 },
		offset: { parameterIndex: 1 },
		parameters: [sample.query.modifiers.limit!.value, sample.query.modifiers.offset!.value],
	};

	expect(res).toStrictEqual(expected);
});

test('Convert query with a sort', () => {
	sample.query.modifiers = {
		sort: [
			{
				type: 'sort',
				direction: 'ascending',
				target: {
					type: 'primitive',
					field: randomIdentifier(),
				},
			},
		],
	};

	const res = convertAbstractQueryToAbstractSqlQuery(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
		],
		from: sample.query.collection,
		order: [
			{
				orderBy: sample.query.modifiers.sort![0]!.target,
				direction: 'ASC',
			},
		],
		parameters: [],
	};

	expect(res).toStrictEqual(expected);
});

test('Convert a query with all possible modifiers', () => {
	sample.query.modifiers = {
		limit: {
			type: 'limit',
			value: randomInteger(1, 100),
		},
		offset: {
			type: 'offset',
			value: randomInteger(1, 100),
		},
		sort: [
			{
				type: 'sort',
				direction: 'ascending',
				target: {
					type: 'primitive',
					field: randomIdentifier(),
				},
			},
		],
	};

	const res = convertAbstractQueryToAbstractSqlQuery(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
		],
		from: sample.query.collection,
		order: [
			{
				orderBy: sample.query.modifiers.sort![0]!.target,
				direction: 'ASC',
			},
		],
		limit: { parameterIndex: 0 },
		offset: { parameterIndex: 1 },
		parameters: [sample.query.modifiers.limit!.value, sample.query.modifiers.offset!.value],
	};

	expect(res).toStrictEqual(expected);
});
