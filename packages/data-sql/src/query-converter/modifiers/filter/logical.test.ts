import { expect, test, beforeEach } from 'vitest';
import { convertLogical } from './logical.js';
import type { AbstractSqlQueryLogicalNode, WhereUnion } from '../../../index.js';
import { randomAlpha, randomIdentifier, randomInteger } from '@directus/random';

let randomCollection: string;
let randomField1: string;
let randomField2: string;
let randomNumber1: number;
let randomString1: string;

beforeEach(() => {
	randomCollection = randomIdentifier();
	randomField1 = randomIdentifier();
	randomField2 = randomIdentifier();
	randomNumber1 = randomInteger(1, 100);
	randomString1 = randomAlpha(5);
});

test('Convert logical node with two conditions', () => {
	const children: WhereUnion[] = [
		{
			where: {
				type: 'condition',
				condition: {
					type: 'condition-number',
					target: {
						type: 'primitive',
						column: randomField1,
						table: randomCollection,
					},
					operation: 'eq',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
				negate: false,
			},
			parameters: [randomNumber1],
		},
		{
			where: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					target: {
						type: 'primitive',
						column: randomField2,
						table: randomCollection,
					},
					operation: 'starts_with',
					compareTo: {
						type: 'value',
						parameterIndex: 1,
					},
				},
				negate: false,
			},
			parameters: [randomString1],
		},
	];

	const expectedWhere: AbstractSqlQueryLogicalNode = {
		type: 'logical',
		negate: false,
		operator: 'and',
		childNodes: [
			{
				type: 'condition',
				condition: {
					type: 'condition-number',
					target: {
						type: 'primitive',
						column: randomField1,
						table: randomCollection,
					},
					operation: 'eq',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
				negate: false,
			},
			{
				type: 'condition',
				condition: {
					type: 'condition-string',
					target: {
						type: 'primitive',
						column: randomField2,
						table: randomCollection,
					},
					operation: 'starts_with',
					compareTo: {
						type: 'value',
						parameterIndex: 1,
					},
				},
				negate: false,
			},
		],
	};

	expect(convertLogical(children, 'and', false)).toStrictEqual({
		where: expectedWhere,
		parameters: [randomNumber1, randomString1],
	});
});
