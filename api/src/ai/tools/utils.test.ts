import { buildSanitizedQueryFromArgs } from './utils.js';
import { sanitizeQuery } from '../../utils/sanitize-query.js';
import type { Accountability, Query, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../utils/sanitize-query.js');

describe('buildSanitizedQueryFromArgs', () => {
	let mockSchema: SchemaOverview;
	let mockAccountability: Accountability;

	beforeEach(() => {
		mockSchema = {
			collections: {},
			relations: [],
		} as SchemaOverview;

		mockAccountability = {
			role: 'admin',
			user: 'test-user-id',
		} as Accountability;

		vi.mocked(sanitizeQuery).mockResolvedValue({} as Query);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	test('Returns empty object when args.query is undefined', async () => {
		const args = {};

		const result = await buildSanitizedQueryFromArgs(args, mockSchema, mockAccountability);

		expect(result).toEqual({});
		expect(sanitizeQuery).not.toHaveBeenCalled();
	});

	test('Returns empty object when args.query is null', async () => {
		const args = { query: null };

		const result = await buildSanitizedQueryFromArgs(args, mockSchema, mockAccountability);

		expect(result).toEqual({});
		expect(sanitizeQuery).not.toHaveBeenCalled();
	});

	test('Calls sanitizeQuery with default fields when fields not provided', async () => {
		const args = {
			query: {
				limit: 10,
			},
		};

		const expectedSanitizedQuery = { limit: 10, fields: ['*'] };
		vi.mocked(sanitizeQuery).mockResolvedValue(expectedSanitizedQuery as Query);

		const result = await buildSanitizedQueryFromArgs(args, mockSchema, mockAccountability);

		expect(sanitizeQuery).toHaveBeenCalledWith(
			{
				fields: '*',
				limit: 10,
			},
			mockSchema,
			mockAccountability,
		);

		expect(result).toEqual(expectedSanitizedQuery);
	});

	test('Calls sanitizeQuery with provided fields', async () => {
		const args = {
			query: {
				fields: ['id', 'name', 'email'],
				limit: 20,
			},
		};

		const expectedSanitizedQuery = { fields: ['id', 'name', 'email'], limit: 20 };
		vi.mocked(sanitizeQuery).mockResolvedValue(expectedSanitizedQuery as Query);

		const result = await buildSanitizedQueryFromArgs(args, mockSchema, mockAccountability);

		expect(sanitizeQuery).toHaveBeenCalledWith(
			{
				fields: ['id', 'name', 'email'],
				limit: 20,
			},
			mockSchema,
			mockAccountability,
		);

		expect(result).toEqual(expectedSanitizedQuery);
	});

	test('Passes undefined accountability when accountability is null', async () => {
		const args = {
			query: {
				limit: 5,
			},
		};

		await buildSanitizedQueryFromArgs(args, mockSchema, null);

		expect(sanitizeQuery).toHaveBeenCalledWith(
			{
				fields: '*',
				limit: 5,
			},
			mockSchema,
			undefined,
		);
	});

	test('Passes undefined accountability when accountability is not provided', async () => {
		const args = {
			query: {
				limit: 5,
			},
		};

		await buildSanitizedQueryFromArgs(args, mockSchema);

		expect(sanitizeQuery).toHaveBeenCalledWith(
			{
				fields: '*',
				limit: 5,
			},
			mockSchema,
			undefined,
		);
	});

	test('Preserves all query properties', async () => {
		const args = {
			query: {
				fields: ['id', 'title'],
				sort: ['-created_at'],
				filter: { status: { _eq: 'published' } },
				limit: 50,
				offset: 10,
				search: 'test',
				group: ['category'],
			},
		};

		const expectedSanitizedQuery = { ...args.query };
		vi.mocked(sanitizeQuery).mockResolvedValue(expectedSanitizedQuery as Query);

		const result = await buildSanitizedQueryFromArgs(args, mockSchema, mockAccountability);

		expect(sanitizeQuery).toHaveBeenCalledWith(
			{
				...args.query,
			},
			mockSchema,
			mockAccountability,
		);

		expect(result).toEqual(expectedSanitizedQuery);
	});

	test('Handles query with fields set to null', async () => {
		const args = {
			query: {
				fields: null,
				limit: 10,
			},
		};

		await buildSanitizedQueryFromArgs(args, mockSchema, mockAccountability);

		expect(sanitizeQuery).toHaveBeenCalledWith(
			{
				fields: null,
				limit: 10,
			},
			mockSchema,
			mockAccountability,
		);
	});

	test('Handles empty query object', async () => {
		const args = {
			query: {},
		};

		await buildSanitizedQueryFromArgs(args, mockSchema, mockAccountability);

		expect(sanitizeQuery).toHaveBeenCalledWith(
			{
				fields: '*',
			},
			mockSchema,
			mockAccountability,
		);
	});

	test('Returns sanitized query result from sanitizeQuery', async () => {
		const args = {
			query: {
				fields: ['id'],
				limit: 100,
			},
		};

		const mockSanitizedResult = {
			fields: ['id'],
			limit: 100,
			offset: 0,
			sort: [],
		};

		vi.mocked(sanitizeQuery).mockResolvedValue(mockSanitizedResult as Query);

		const result = await buildSanitizedQueryFromArgs(args, mockSchema, mockAccountability);

		expect(result).toEqual(mockSanitizedResult);
	});

	test('Works with additional properties in args', async () => {
		const args = {
			query: {
				limit: 10,
			},
			collection: 'articles',
			additionalProp: 'value',
		};

		await buildSanitizedQueryFromArgs(args, mockSchema, mockAccountability);

		expect(sanitizeQuery).toHaveBeenCalledWith(
			{
				fields: '*',
				limit: 10,
			},
			mockSchema,
			mockAccountability,
		);
	});
});
