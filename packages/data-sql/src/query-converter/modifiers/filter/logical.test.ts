import { expect, test, beforeEach } from 'vitest';
import { convertLogical } from './logical.js';
import { randomAlpha, randomIdentifier, randomInteger } from '@directus/random';
import type { FilterResult } from './filter.js';
import type { AtLeastOneElement } from '@directus/data';

// first condition (with nested target)
let localCollection: string;
let randomField1: string;
let randomNumber: number;
let joinAlias: string;

// second condition
let foreignCollection: string;
let randomField2: string;
let randomString: string;

beforeEach(() => {
	localCollection = randomIdentifier();
	randomField1 = randomIdentifier();
	joinAlias = randomIdentifier();
	randomField2 = randomIdentifier();
	randomNumber = randomInteger(1, 100);
	randomString = randomAlpha(5);
	foreignCollection = randomIdentifier();
});

test('Convert logical node with two conditions', () => {
	const children: AtLeastOneElement<FilterResult> = [
		{
			clauses: {
				where: {
					type: 'condition',
					condition: {
						type: 'condition-number',
						target: {
							type: 'primitive',
							column: randomField1,
							table: foreignCollection,
						},
						operation: 'eq',
						compareTo: {
							type: 'value',
							parameterIndex: 0,
						},
					},
					negate: false,
				},
				joins: [
					{
						type: 'join',
						table: localCollection,
						on: {
							type: 'condition',
							condition: {
								type: 'condition-field',
								target: {
									type: 'primitive',
									column: randomField1,
									table: localCollection,
								},
								operation: 'eq',
								compareTo: {
									type: 'primitive',
									column: randomField1,
									table: localCollection,
								},
							},
							negate: false,
						},
						as: joinAlias,
					},
				],
			},
			parameters: [randomNumber],
		},
		{
			clauses: {
				where: {
					type: 'condition',
					condition: {
						type: 'condition-string',
						target: {
							type: 'primitive',
							column: randomField2,
							table: localCollection,
						},
						operation: 'starts_with',
						compareTo: {
							type: 'value',
							parameterIndex: 1,
						},
					},
					negate: false,
				},
				joins: [],
			},
			parameters: [randomString],
		},
	];

	const expectedResult: FilterResult = {
		clauses: {
			joins: [
				{
					type: 'join',
					table: localCollection,
					on: {
						type: 'condition',
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								column: randomField1,
								table: localCollection,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								column: randomField1,
								table: localCollection,
							},
						},
						negate: false,
					},
					as: joinAlias,
				},
			],
			where: {
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
								table: foreignCollection,
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
								table: localCollection,
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
			},
		},
		parameters: [randomNumber, randomString],
	};

	expect(convertLogical(children, 'and', false)).toStrictEqual(expectedResult);
});
