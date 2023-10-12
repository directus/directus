import type { AbstractQuery, AbstractQueryFieldNodePrimitive } from '@directus/data';
import { beforeEach, expect, test } from 'vitest';
import type { AbstractSqlQuery } from '../types/index.js';
import { convertQuery } from './converter.js';
import { randomIdentifier, randomInteger } from '@directus/random';

let sample: AbstractQuery;

beforeEach(() => {
	sample = {
		store: randomIdentifier(),
		collection: randomIdentifier(),
		fields: [
			{
				type: 'primitive',
				field: randomIdentifier(),
			},
			{
				type: 'primitive',
				field: randomIdentifier(),
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
					table: sample.collection,
					column: (sample.fields[0] as AbstractQueryFieldNodePrimitive).field,
				},
				{
					type: 'primitive',
					table: sample.collection,
					column: (sample.fields[1] as AbstractQueryFieldNodePrimitive).field,
				},
			],
			from: sample.collection,
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
					table: sample.collection,
					column: (sample.fields[0] as AbstractQueryFieldNodePrimitive).field,
				},
				{
					type: 'primitive',
					table: sample.collection,
					column: (sample.fields[1] as AbstractQueryFieldNodePrimitive).field,
				},
			],
			from: sample.collection,
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-number',
					target: {
						column: randomField,
						table: sample.collection,
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
					table: sample.collection,
					column: (sample.fields[0] as AbstractQueryFieldNodePrimitive).field,
				},
				{
					type: 'primitive',
					table: sample.collection,
					column: (sample.fields[1] as AbstractQueryFieldNodePrimitive).field,
				},
			],
			from: sample.collection,
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
					table: sample.collection,
					column: (sample.fields[0] as AbstractQueryFieldNodePrimitive).field,
				},
				{
					type: 'primitive',
					table: sample.collection,
					column: (sample.fields[1] as AbstractQueryFieldNodePrimitive).field,
				},
			],
			from: sample.collection,
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
					table: sample.collection,
					column: (sample.fields[0] as AbstractQueryFieldNodePrimitive).field,
				},
				{
					type: 'primitive',
					table: sample.collection,
					column: (sample.fields[1] as AbstractQueryFieldNodePrimitive).field,
				},
			],
			from: sample.collection,
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
					table: sample.collection,
					column: (sample.fields[0] as AbstractQueryFieldNodePrimitive).field,
				},
				{
					type: 'primitive',
					table: sample.collection,
					column: (sample.fields[1] as AbstractQueryFieldNodePrimitive).field,
				},
				{
					type: 'fn',
					fn: {
						type: 'arrayFn',
						fn: 'count',
					},
					table: sample.collection,
					column: randomField,
				},
			],
			from: sample.collection,
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
					table: sample.collection,
					column: (sample.fields[0] as AbstractQueryFieldNodePrimitive).field,
				},
				{
					type: 'primitive',
					table: sample.collection,
					column: (sample.fields[1] as AbstractQueryFieldNodePrimitive).field,
				},
			],
			from: sample.collection,
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
