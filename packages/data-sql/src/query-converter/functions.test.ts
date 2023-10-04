import type { AbstractQueryFieldNodeFn } from '@directus/data';
import { randomAlpha, randomIdentifier } from '@directus/random';
import { describe, expect, test, beforeEach } from 'vitest';
import type { AbstractSqlQueryFnNode } from '../types/clauses/selects/fn.js';
import { parameterIndexGenerator } from './param-index-generator.js';
import { convertFn } from './functions.js';

let randomCollection: string;
let idGen: Generator<number, number, number>;
let sampleField: string;

beforeEach(() => {
	randomCollection = randomIdentifier();
	idGen = parameterIndexGenerator();
	sampleField = randomIdentifier();
});

describe('Convert function', () => {
	test('With no args', () => {
		const sampleAbstractFn: AbstractQueryFieldNodeFn = {
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			field: sampleField,
		};

		const res = convertFn(randomCollection, sampleAbstractFn, idGen);

		const expectedSqlFn: AbstractSqlQueryFnNode = {
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			table: randomCollection,
			column: sampleField,
		};

		expect(res).toStrictEqual({
			fn: expectedSqlFn,
			parameters: [],
		});
	});

	test('With an generated alias and user alias', () => {
		const uniqueId = randomIdentifier();
		const randomUserAlias = randomIdentifier();

		const sampleAbstractFn: AbstractQueryFieldNodeFn = {
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			field: sampleField,
			alias: randomUserAlias,
		};

		const res = convertFn(randomCollection, sampleAbstractFn, idGen, uniqueId);

		const expectedSqlFn: AbstractSqlQueryFnNode = {
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			table: randomCollection,
			column: sampleField,
			alias: randomUserAlias,
			as: uniqueId,
		};

		expect(res).toStrictEqual({
			fn: expectedSqlFn,
			parameters: [],
		});
	});

	test('With args', () => {
		const randomArgument1 = randomAlpha(5);
		const randomArgument2 = randomAlpha(5);

		const sampleFn: AbstractQueryFieldNodeFn = {
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			field: sampleField,
			args: [randomArgument1, randomArgument2],
		};

		const res = convertFn(randomCollection, sampleFn, idGen);

		const sampleSqlFn: AbstractSqlQueryFnNode = {
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			table: randomCollection,
			column: sampleField,
			arguments: {
				type: 'values',
				parameterIndexes: [0, 1],
			},
		};

		expect(res).toStrictEqual({
			fn: sampleSqlFn,
			parameters: [randomArgument1, randomArgument2],
		});
	});
});
