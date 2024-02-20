import type { AbstractSqlQueryJsonNode } from '@directus/data-sql';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { applyJsonPathIfNeeded } from './json-path.js';

test('append a json prop with array syntax', () => {
	const target = randomIdentifier();
	const columnName = randomIdentifier();
	const pathIndex = randomInteger(10, 20);

	const sampleJsonNode: AbstractSqlQueryJsonNode = {
		type: 'json',
		columnName,
		path: [pathIndex],
		tableIndex: randomInteger(0, 10),
	};

	const expected = target + ` ->> $${pathIndex + 1}`;
	const res = applyJsonPathIfNeeded(sampleJsonNode, target);
	expect(res).toStrictEqual(expected);
});

test('append deeply nested json props with array syntax', () => {
	const target = randomIdentifier();
	const columnName = randomIdentifier();
	const pathIndex = randomInteger(10, 20);

	const sampleJsonNode: AbstractSqlQueryJsonNode = {
		type: 'json',
		columnName,
		path: [pathIndex, pathIndex + 1, pathIndex + 2],
		tableIndex: randomInteger(0, 10),
	};

	const expected = target + ` -> $${pathIndex + 1} -> $${pathIndex + 2} ->> $${pathIndex + 3}`;
	const res = applyJsonPathIfNeeded(sampleJsonNode, target);
	expect(res).toStrictEqual(expected);
});
