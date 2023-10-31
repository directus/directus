import type { AbstractQuery } from '@directus/data';
import { beforeEach, expect, test } from 'vitest';
import type { AbstractSqlQuery } from '../types/index.js';
import { convertQuery } from './converter.js';
import { randomAlpha, randomIdentifier, randomInteger } from '@directus/random';

let sample: AbstractQuery;

const firstField = randomIdentifier();
const secondField = randomIdentifier();
const rootCollection = randomIdentifier();
const rootStore = randomIdentifier();

beforeEach(() => {
	sample = {
		store: rootStore,
		collection: rootCollection,
		fields: [
			{
				type: 'primitive',
				field: firstField,
			},
			{
				type: 'primitive',
				field: secondField,
			},
		],
	};
});

test('Convert simple query', () => {
	const res = convertQuery(sample);

	const expected: Required<Pick<AbstractSqlQuery, 'clauses' | 'parameters'>> = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
				},
			],
			from: rootCollection,
		},
		parameters: [],
	};

	expect(res.clauses).toMatchObject(expected.clauses);
	expect(res.parameters).toMatchObject(expected.parameters);
});

test('Convert query with filter', () => {
	const randomField = randomIdentifier();
	const compareToValue = randomInteger(1, 100);

	sample.modifiers = {
		filter: {
			type: 'condition',
			condition: {
				type: 'condition-number',
				target: {
					type: 'primitive',
					field: randomField,
				},
				operation: 'gt',
				compareTo: compareToValue,
			},
		},
	};

	const res = convertQuery(sample);

	const expected: Required<Pick<AbstractSqlQuery, 'clauses' | 'parameters'>> = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
				},
			],
			from: rootCollection,
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-number',
					target: {
						column: randomField,
						table: rootCollection,
						type: 'primitive',
					},
					operation: 'gt',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
		},
		parameters: [compareToValue],
	};

	expect(res.clauses).toMatchObject(expected.clauses);
	expect(res.parameters).toMatchObject(expected.parameters);
});

test('Convert query with a limit', () => {
	sample.modifiers = {
		limit: {
			type: 'limit',
			value: randomInteger(1, 100),
		},
	};

	const res = convertQuery(sample);

	const expected: Required<Pick<AbstractSqlQuery, 'clauses' | 'parameters'>> = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
				},
			],
			from: rootCollection,
			limit: { type: 'value', parameterIndex: 0 },
		},
		parameters: [sample.modifiers.limit!.value],
	};

	expect(res.clauses).toMatchObject(expected.clauses);
	expect(res.parameters).toMatchObject(expected.parameters);
});

test('Convert query with limit and offset', () => {
	sample.modifiers = {
		limit: {
			type: 'limit',
			value: randomInteger(1, 100),
		},
		offset: {
			type: 'offset',
			value: randomInteger(1, 100),
		},
	};

	const res = convertQuery(sample);

	const expected: Required<Pick<AbstractSqlQuery, 'clauses' | 'parameters'>> = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
				},
			],
			from: rootCollection,
			limit: { type: 'value', parameterIndex: 0 },
			offset: { type: 'value', parameterIndex: 1 },
		},
		parameters: [sample.modifiers.limit!.value, sample.modifiers.offset!.value],
	};

	expect(res.clauses).toMatchObject(expected.clauses);
	expect(res.parameters).toMatchObject(expected.parameters);
});

test('Convert query with a sort', () => {
	sample.modifiers = {
		sort: [
			{
				type: 'sort',
				direction: 'ascending',
				target: {
					type: 'primitive',
					field: randomIdentifier(),
				},
			},
		],
	};

	const res = convertQuery(sample);

	const expected: Required<Pick<AbstractSqlQuery, 'clauses' | 'parameters'>> = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
				},
			],
			from: rootCollection,
			order: [
				{
					type: 'order',
					orderBy: sample.modifiers.sort![0]!.target,
					direction: 'ASC',
				},
			],
		},
		parameters: [],
	};

	expect(res.clauses).toMatchObject(expected.clauses);
	expect(res.parameters).toMatchObject(expected.parameters);
});

test('Convert a query with a function as field select', () => {
	const randomField = randomIdentifier();

	sample.fields.push({
		type: 'fn',
		fn: {
			type: 'arrayFn',
			fn: 'count',
		},
		field: randomField,
	});

	const res = convertQuery(sample);

	const expected: Required<Pick<AbstractSqlQuery, 'clauses' | 'parameters'>> = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
				},
				{
					type: 'fn',
					fn: {
						type: 'arrayFn',
						fn: 'count',
					},
					table: rootCollection,
					column: randomField,
				},
			],
			from: rootCollection,
		},
		parameters: [],
	};

	expect(res.clauses).toMatchObject(expected.clauses);
	expect(res.parameters).toMatchObject(expected.parameters);
});

test('Convert a query with all possible modifiers', () => {
	sample.modifiers = {
		limit: {
			type: 'limit',
			value: randomInteger(1, 100),
		},
		offset: {
			type: 'offset',
			value: randomInteger(1, 100),
		},
		sort: [
			{
				type: 'sort',
				direction: 'ascending',
				target: {
					type: 'primitive',
					field: randomIdentifier(),
				},
			},
		],
	};

	const res = convertQuery(sample);

	const expected: Required<Pick<AbstractSqlQuery, 'clauses' | 'parameters'>> = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
				},
			],
			from: rootCollection,
			order: [
				{
					type: 'order',
					orderBy: sample.modifiers.sort![0]!.target,
					direction: 'ASC',
				},
			],
			limit: { type: 'value', parameterIndex: 0 },
			offset: { type: 'value', parameterIndex: 1 },
		},
		parameters: [sample.modifiers.limit!.value, sample.modifiers.offset!.value],
	};

	expect(res.clauses).toMatchObject(expected.clauses);
	expect(res.parameters).toMatchObject(expected.parameters);
});

test('Convert a query with a foreign/right string filter', () => {
	const foreignCollection = randomIdentifier();
	const targetField = randomIdentifier();
	const leftHandIdentifierField = randomIdentifier();
	const rightHandIdentifierField = randomIdentifier();
	const compareValue = randomAlpha(3);
	const joinAlias = randomIdentifier();

	const sampleAbstractQuery: AbstractQuery = {
		store: rootStore,
		collection: rootCollection,
		fields: [
			{
				type: 'primitive',
				field: firstField,
			},
			{
				type: 'primitive',
				field: secondField,
			},
		],
		modifiers: {
			filter: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					target: {
						type: 'nested-one-target',
						field: {
							type: 'primitive',
							field: targetField,
						},
						meta: {
							type: 'm2o',
							join: {
								local: {
									fields: [leftHandIdentifierField],
								},
								foreign: {
									store: rootStore,
									fields: [rightHandIdentifierField],
									collection: foreignCollection,
								},
							},
						},
					},
					operation: 'starts_with',
					compareTo: compareValue,
				},
			},
		},
	};

	const res = convertQuery(sampleAbstractQuery);

	const expected: Required<Pick<AbstractSqlQuery, 'clauses' | 'parameters'>> = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
				},
			],
			from: rootCollection,
			joins: [
				{
					type: 'join',
					table: foreignCollection,
					on: {
						type: 'condition',
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								table: foreignCollection,
								column: targetField,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								table: rootCollection,
								column: leftHandIdentifierField,
							},
						},
						negate: false,
					},
					as: joinAlias,
				},
			],
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-string',
					target: {
						type: 'primitive',
						table: foreignCollection,
						column: targetField,
					},
					operation: 'contains',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
		},
		parameters: [compareValue],
	};

	expect(res.clauses).toMatchObject(expected.clauses);
	expect(res.parameters).toMatchObject(expected.parameters);
});
