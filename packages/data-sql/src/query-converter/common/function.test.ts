import type { AbstractQueryFunction } from '@directus/data';
import { randomAlpha, randomIdentifier } from '@directus/random';
import { beforeEach, describe, expect, test } from 'vitest';
import type { AbstractSqlQueryFnNode } from '../../types/index.js';
import { convertFn } from './function.js';
import { createIndexGenerators, type IndexGenerators } from '../../utils/create-index-generators.js';

let randomCollection: string;
let indexGen: IndexGenerators;
let sampleField: string;

beforeEach(() => {
	randomCollection = randomIdentifier();
	indexGen = createIndexGenerators();
	sampleField = randomIdentifier();
});

describe('Convert function', () => {
	test('With no args', () => {
		const sampleAbstractFn: AbstractQueryFunction = {
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			field: sampleField,
		};

		const res = convertFn(randomCollection, sampleAbstractFn, indexGen);

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

	test('With args', () => {
		const randomArgument1 = randomAlpha(5);
		const randomArgument2 = randomAlpha(5);

		const sampleFn: AbstractQueryFunction = {
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			field: sampleField,
			args: [randomArgument1, randomArgument2],
		};

		const res = convertFn(randomCollection, sampleFn, indexGen);

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
