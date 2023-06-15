import type { AbstractQuery, AbstractQueryFieldNodePrimitive } from '@directus/data';
import { beforeEach, expect, test } from 'vitest';
import type { SqlStatement } from '../types.js';
import { convertAbstractQueryToSqlStatement } from './index.js';
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

test('Get all selects', () => {
	const res = convertAbstractQueryToSqlStatement(sample.query);

	const expected: SqlStatement = {
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

test('Get selects with a limit', () => {
	sample.query.modifiers = {
		limit: {
			type: 'limit',
			value: randomInteger(1, 100),
		},
	};

	const res = convertAbstractQueryToSqlStatement(sample.query);

	const expected: SqlStatement = {
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
		// @ts-ignore
		limit: 1,
		// @ts-ignore
		parameters: [sample.query.modifiers.limit.value],
	};

	expect(res).toStrictEqual(expected);
});

test('Get selects with a limit and offset', () => {
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

	const res = convertAbstractQueryToSqlStatement(sample.query);

	const expected: SqlStatement = {
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
		limit: 1,
		offset: 2,
		// @ts-ignore
		parameters: [sample.query.modifiers.limit.value, sample.query.modifiers.offset.value],
	};

	expect(res).toStrictEqual(expected);
});

test('Get selects with a sort', () => {
	sample.query.modifiers = {
		sort: {
			type: 'sort',
			direction: 'ascending',
			target: {
				type: 'primitive',
				field: randomIdentifier(),
			},
		},
	};

	const res = convertAbstractQueryToSqlStatement(sample.query);

	const expected: SqlStatement = {
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
		// @ts-ignore
		orderBy: 0,
		order: 'ASC',
		// @ts-ignore
		parameters: [sample.query.modifiers.sort.target],
	};

	expect(res).toStrictEqual(expected);
});
