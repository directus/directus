import { expect, test } from 'vitest';
import { mergeFields } from './merge-fields.js';

type Case = {
	fieldsA: string[] | null;
	fieldsB: string[] | null;
	expectedAnd: string[];
	expectedOr: string[];
};

const cases: Case[] = [
	{
		fieldsA: null,
		fieldsB: null,
		expectedAnd: [],
		expectedOr: [],
	},
	{
		fieldsA: [],
		fieldsB: null,
		expectedAnd: [],
		expectedOr: [],
	},
	{
		fieldsA: null,
		fieldsB: [],
		expectedAnd: [],
		expectedOr: [],
	},
	{
		fieldsA: [],
		fieldsB: [],
		expectedAnd: [],
		expectedOr: [],
	},
	{
		fieldsA: ['a'],
		fieldsB: [],
		expectedAnd: [],
		expectedOr: ['a'],
	},
	{
		fieldsA: ['a'],
		fieldsB: ['a'],
		expectedAnd: ['a'],
		expectedOr: ['a'],
	},
	{
		fieldsA: ['a', 'b'],
		fieldsB: ['a'],
		expectedAnd: ['a'],
		expectedOr: ['a', 'b'],
	},
	{
		fieldsA: ['a'],
		fieldsB: ['b'],
		expectedAnd: [],
		expectedOr: ['a', 'b'],
	},
	{
		fieldsA: ['*'],
		fieldsB: [],
		expectedAnd: [],
		expectedOr: ['*'],
	},
	{
		fieldsA: ['*'],
		fieldsB: ['a'],
		expectedAnd: ['a'],
		expectedOr: ['*'],
	},
	{
		fieldsA: ['*', 'b'],
		fieldsB: ['a'],
		expectedAnd: ['a'],
		expectedOr: ['*'],
	},
	{
		fieldsA: ['*', 'b'],
		fieldsB: ['a', 'b'],
		expectedAnd: ['a', 'b'],
		expectedOr: ['*'],
	},
	{
		fieldsA: ['*'],
		fieldsB: ['*'],
		expectedAnd: ['*'],
		expectedOr: ['*'],
	},
];

for (const { fieldsA, fieldsB, expectedAnd, expectedOr } of cases) {
	test(`mergeFields(${fieldsA ? `[${fieldsA}]` : null}, ${
		fieldsB ? `[${fieldsB}]` : null
	}, and) should return [${expectedAnd}]`, () => {
		const result = mergeFields(fieldsA, fieldsB, 'and');
		expect(result).toEqual(expectedAnd);
		expect(result.sort()).toEqual(mergeFields(fieldsB, fieldsA, 'and').sort()); // Check commutativity
	});

	test(`mergeFields(${fieldsA ? `[${fieldsA}]` : null}, ${
		fieldsB ? `[${fieldsB}]` : null
	}, or) should return [${expectedOr}]`, () => {
		const result = mergeFields(fieldsA, fieldsB, 'or');
		expect(result).toEqual(expectedOr);
		expect(result.sort()).toEqual(mergeFields(fieldsB, fieldsA, 'or').sort()); // Check commutativity
	});
}
