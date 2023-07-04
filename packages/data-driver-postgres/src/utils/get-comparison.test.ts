import { beforeEach, expect, test } from 'vitest';
import type { ValueNode } from '@directus/data-sql';
import { randomInteger } from '@directus/random';
import { getComparison } from './get-comparison.js';

let compareTo: ValueNode;

beforeEach(() => {
	compareTo = {
		type: 'value',
		parameterIndexes: [randomInteger(1, 10)],
	};
});

test('eq', () => {
	expect(getComparison('eq', compareTo)).toStrictEqual(`= $${compareTo.parameterIndexes[0]! + 1}`);
});

test('gt', () => {
	expect(getComparison('gt', compareTo)).toStrictEqual(`> $${compareTo.parameterIndexes[0]! + 1}`);
});

test('gte', () => {
	expect(getComparison('gte', compareTo)).toStrictEqual(`>= $${compareTo.parameterIndexes[0]! + 1}`);
});

test('lt', () => {
	expect(getComparison('lt', compareTo)).toStrictEqual(`< $${compareTo.parameterIndexes[0]! + 1}`);
});

test('lte', () => {
	expect(getComparison('lte', compareTo)).toStrictEqual(`<= $${compareTo.parameterIndexes[0]! + 1}`);
});

test('contains', () => {
	expect(getComparison('contains', compareTo)).toStrictEqual(`LIKE '%$${compareTo.parameterIndexes[0]! + 1}%'`);
});

test('starts_with', () => {
	expect(getComparison('starts_with', compareTo)).toStrictEqual(`LIKE '$${compareTo.parameterIndexes[0]! + 1}%'`);
});

test('ends_with', () => {
	expect(getComparison('ends_with', compareTo)).toStrictEqual(`LIKE '%$${compareTo.parameterIndexes[0]! + 1}'`);
});

test.skip('in', () => {
	compareTo = {
		type: 'value',
		parameterIndexes: [randomInteger(1, 10), randomInteger(1, 10)],
	};

	expect(getComparison('in', compareTo)).toStrictEqual(
		`IN ($${compareTo.parameterIndexes[0]! + 1}, $${compareTo.parameterIndexes[1]! + 1})`
	);
});
