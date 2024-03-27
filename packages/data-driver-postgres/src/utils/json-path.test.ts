import type { AbstractSqlQueryJsonNode } from '@directus/data-sql';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { applyJsonPathAsObject, applyJsonPathAsString } from './json-path.js';

test('json prop with array syntax', () => {
	const target = randomIdentifier();
	const columnName = randomIdentifier();
	const pathIndex = randomInteger(10, 20);

	const sampleJsonNode: AbstractSqlQueryJsonNode = {
		type: 'json',
		columnName,
		path: [pathIndex],
		tableIndex: randomInteger(0, 10),
	};

	const expected = `${target} ->> $${pathIndex + 1}`;
	const res = applyJsonPathAsString(target, sampleJsonNode.path);
	expect(res).toStrictEqual(expected);
});

test('deeply nested json props with array syntax', () => {
	const target = randomIdentifier();
	const columnName = randomIdentifier();
	const pathIndex = randomInteger(10, 20);

	const sampleJsonNode: AbstractSqlQueryJsonNode = {
		type: 'json',
		columnName,
		path: [pathIndex, pathIndex + 1, pathIndex + 2],
		tableIndex: randomInteger(0, 10),
	};

	const expected = `${target} -> $${pathIndex + 1} -> $${pathIndex + 2} ->> $${pathIndex + 3}`;
	const res = applyJsonPathAsString(target, sampleJsonNode.path);
	expect(res).toStrictEqual(expected);
});

test('json prop with array syntax as number', () => {
	const target = randomIdentifier();
	const columnName = randomIdentifier();
	const pathIndex = randomInteger(10, 20);

	const sampleJsonNode: AbstractSqlQueryJsonNode = {
		type: 'json',
		tableIndex: randomInteger(0, 10),
		columnName,
		path: [pathIndex, pathIndex + 1],
	};

	const expected = `${target} -> $${pathIndex + 1} -> $${pathIndex + 2}`;
	const res = applyJsonPathAsObject(target, sampleJsonNode.path);
	expect(res).toStrictEqual(expected);
});

test('json prop with array syntax as object', () => {
	const target = randomIdentifier();
	const columnName = randomIdentifier();
	const pathIndex = randomInteger(10, 20);

	const sampleJsonNode: AbstractSqlQueryJsonNode = {
		type: 'json',
		tableIndex: randomInteger(0, 10),
		columnName,
		path: [pathIndex],
	};

	const expected = `${target} -> $${pathIndex + 1}`;
	const res = applyJsonPathAsObject(target, sampleJsonNode.path);
	expect(res).toStrictEqual(expected);
});
