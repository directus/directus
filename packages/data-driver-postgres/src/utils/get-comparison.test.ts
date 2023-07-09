import { beforeEach, expect, test } from 'vitest';
import type { ValueNode } from '@directus/data-sql';
import { randomInteger } from '@directus/random';
import { getComparison } from './get-comparison.js';

let compareTo: ValueNode;
let value: number;

beforeEach(() => {
	compareTo = {
		type: 'value',
		parameterIndexes: [randomInteger(1, 10)],
	};

	value = compareTo.parameterIndexes[0]! + 1;
});

test('eq', () => {
	expect(getComparison('eq', compareTo)).toStrictEqual(`= $${value}`);
});

test('gt', () => {
	expect(getComparison('gt', compareTo)).toStrictEqual(`> $${value}`);
});

test('gte', () => {
	expect(getComparison('gte', compareTo)).toStrictEqual(`>= $${value}`);
});

test('lt', () => {
	expect(getComparison('lt', compareTo)).toStrictEqual(`< $${value}`);
});

test('lte', () => {
	expect(getComparison('lte', compareTo)).toStrictEqual(`<= $${value}`);
});

test('contains', () => {
	expect(getComparison('contains', compareTo)).toStrictEqual(`LIKE '%$${value}%'`);
});

test('starts_with', () => {
	expect(getComparison('starts_with', compareTo)).toStrictEqual(`LIKE '$${value}%'`);
});

test('ends_with', () => {
	expect(getComparison('ends_with', compareTo)).toStrictEqual(`LIKE '%$${value}'`);
});

test.skip('in', () => {
	compareTo = {
		type: 'value',
		parameterIndexes: [randomInteger(1, 10), randomInteger(1, 10)],
	};

	expect(getComparison('in', compareTo)).toStrictEqual(`IN ($${value}, $${compareTo.parameterIndexes[1]! + 1})`);
});
