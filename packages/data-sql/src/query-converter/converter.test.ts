import type { AbstractQuery } from '@directus/data';
import { expect, test, vi, afterEach } from 'vitest';
import type {
	AbstractSqlQuery,
	AbstractSqlQueryConditionNode,
	AbstractSqlQueryJoinNode,
	AbstractSqlQuerySelectNode,
} from '../types/index.js';
import { convertQuery } from './converter.js';
import { randomAlpha, randomIdentifier } from '@directus/random';
import { convertFieldNodes, type FieldConversionResult } from './fields/fields.js';
import { convertModifiers, type ModifierConversionResult } from './modifiers/modifiers.js';

vi.mock('./fields/fields.js', (importOriginal) => {
	const mod = importOriginal();
	return {
		...mod,
		convertFieldNodes: vi.fn(),
	};
});

vi.mock('./modifiers/modifiers.js', (importOriginal) => {
	const mod = importOriginal();
	return {
		...mod,
		convertModifiers: vi.fn(),
	};
});

const rootCollection = randomIdentifier();
const rootStore = randomIdentifier();

afterEach(() => {
	vi.restoreAllMocks();
});

test('Convert a query with a foreign/right string filter', () => {
	const sampleAbstractQuery = {
		store: rootStore,
		collection: rootCollection,
	} as AbstractQuery;

	const fieldConversionResult: FieldConversionResult = {
		clauses: {
			select: [
				{ type: 'primitive' } as AbstractSqlQuerySelectNode,
				{ type: 'primitive' } as AbstractSqlQuerySelectNode,
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: new Map(),
		nestedManys: [],
	};

	vi.mocked(convertFieldNodes).mockReturnValueOnce(fieldConversionResult);

	const modifierConversionResult: ModifierConversionResult = {
		clauses: {
			joins: [{ type: 'join' } as AbstractSqlQueryJoinNode],
			where: { type: 'condition' } as AbstractSqlQueryConditionNode,
		},
		parameters: [randomIdentifier()],
	};

	vi.mocked(convertModifiers).mockReturnValueOnce(modifierConversionResult);

	const res = convertQuery(sampleAbstractQuery);

	const expected: Required<Pick<AbstractSqlQuery, 'clauses' | 'parameters'>> = {
		clauses: {
			select: fieldConversionResult.clauses.select,
			from: rootCollection,
			joins: modifierConversionResult.clauses.joins!,
			where: modifierConversionResult.clauses.where!,
		},
		parameters: modifierConversionResult.parameters,
	};

	expect(res.clauses).toStrictEqual(expected.clauses);
	expect(res.parameters).toStrictEqual(expected.parameters);
});

test('remove duplicated joins', () => {
	const sampleAbstractQuery = { collection: rootCollection } as AbstractQuery;

	// this is used in the result of the field conversion as well as in the result of the modifier conversion
	const joinNode = {} as AbstractSqlQueryJoinNode;

	const fieldConversionResult: FieldConversionResult = {
		clauses: {
			select: [] as AbstractSqlQuerySelectNode[],
			joins: [joinNode],
		},
		parameters: [],
		aliasMapping: new Map(),
		nestedManys: [],
	};

	vi.mocked(convertFieldNodes).mockReturnValueOnce(fieldConversionResult);

	const modifierConversionResult: ModifierConversionResult = {
		clauses: {
			joins: [joinNode],
			where: {} as AbstractSqlQueryConditionNode,
		},
		parameters: [randomAlpha(3)],
	};

	vi.mocked(convertModifiers).mockReturnValueOnce(modifierConversionResult);

	const res = convertQuery(sampleAbstractQuery);

	const expected: Required<Pick<AbstractSqlQuery, 'clauses' | 'parameters'>> = {
		clauses: {
			select: fieldConversionResult.clauses.select,
			from: rootCollection,
			joins: [joinNode], // here only one join should be present
			where: modifierConversionResult.clauses.where!,
		},
		parameters: modifierConversionResult.parameters,
	};

	expect(res.clauses).toStrictEqual(expected.clauses);
	expect(res.parameters).toStrictEqual(expected.parameters);
});
