import { getRandomIdentifier, type AbstractQuery, type AbstractQueryFieldNodePrimitive } from '@directus/data';
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
			store: getRandomIdentifier(),
			collection: getRandomIdentifier(),
			nodes: [
				{
					type: 'primitive',
					field: getRandomIdentifier(),
				},
				{
					type: 'primitive',
					field: getRandomIdentifier(),
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
