import type { AbstractQuery, AbstractQueryFieldNodePrimitive } from '@directus/data';
import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import type { SqlStatement } from '../types.js';
import { convertAbstractQueryToSqlStatement } from './index.js';

let sample: {
	query: AbstractQuery;
};

beforeEach(() => {
	sample = {
		query: {
			root: true,
			store: randomAlpha(randomInteger(3, 25)),
			collection: randomAlpha(randomInteger(3, 25)),
			nodes: [
				{
					type: 'primitive',
					field: randomAlpha(randomInteger(3, 25)),
				},
				{
					type: 'primitive',
					field: randomAlpha(randomInteger(3, 25)),
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
	};

	expect(res).toStrictEqual(expected);
});

test('Get selects with a limit', () => {
	sample.query.modifiers = {
		limit: {
			type: 'limit',
			value: 10,
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
		limit: sample.query.modifiers.limit.value,
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
		// @ts-ignore
		limit: sample.query.modifiers.limit.value,
		// @ts-ignore
		offset: sample.query.modifiers.offset.value,
	};

	expect(res).toStrictEqual(expected);
});
