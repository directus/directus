import { ForbiddenError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Permission, Query } from '@directus/types';
import { knex } from 'knex';
import { MockClient } from 'knex-mock-client';
import { beforeEach, describe, expect, type MockedFunction, test, vi } from 'vitest';
import applyQuery from '../database/run-ast/lib/apply-query/index.js';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import { getCases } from '../permissions/modules/process-ast/lib/get-cases.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import { MetaService } from './meta.js';

vi.mock('../database/run-ast/lib/apply-query/index.js', () => ({ default: vi.fn() }));

vi.mock('../permissions/lib/fetch-permissions.js', () => ({
	fetchPermissions: vi.fn(),
}));

vi.mock('../permissions/lib/fetch-policies.js', () => ({
	fetchPolicies: vi.fn(),
}));

vi.mock('../permissions/modules/process-ast/lib/get-cases.js', () => ({
	getCases: vi.fn(),
}));

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

describe('MetaService', () => {
	let db: MockedFunction<knex.Knex<any, unknown[]>>;

	const mockSchema = new SchemaBuilder()
		.collection('test_collection', (c) => {
			c.field('id').id();
		})
		.build();

	beforeEach(() => {
		vi.clearAllMocks();

		db = vi.mocked(knex.default({ client: MockClient }));
	});

	describe('getMetaForQuery', () => {
		let service: MetaService;

		const mockAccountability = createDefaultAccountability({
			admin: false,
		});

		beforeEach(() => {
			vi.clearAllMocks();

			service = new MetaService({
				knex: db,
				accountability: mockAccountability,
				schema: mockSchema,
			});
		});

		describe('should return undefined when query is falsy', async () => {
			test.each([null, undefined])('%s', async () => {
				const result = await service.getMetaForQuery('test_collection', null);
				expect(result).toBeUndefined();
			});
		});

		test('should return undefined when query.meta is falsy', async () => {
			const query = { filter: { status: 'published' } };
			const result = await service.getMetaForQuery('test_collection', query);
			expect(result).toBeUndefined();
		});

		test('should handle total_count meta value', async () => {
			vi.spyOn(service, 'totalCount').mockResolvedValue(100);

			const query = { meta: ['total_count'] };
			const result = await service.getMetaForQuery('test_collection', query);

			expect(service.totalCount).toHaveBeenCalledWith('test_collection');
			expect(result).toEqual({ total_count: 100 });
		});

		test('should handle filter_count meta value', async () => {
			vi.spyOn(service, 'filterCount').mockResolvedValue(50);

			const query = { meta: ['filter_count'], filter: { status: 'published' } };
			const result = await service.getMetaForQuery('test_collection', query);

			expect(service.filterCount).toHaveBeenCalledWith('test_collection', query);
			expect(result).toEqual({ filter_count: 50 });
		});

		test('should handle multiple meta values', async () => {
			vi.spyOn(service, 'totalCount').mockResolvedValue(100);
			vi.spyOn(service, 'filterCount').mockResolvedValue(50);

			const query = { meta: ['total_count', 'filter_count'] };
			const result = await service.getMetaForQuery('test_collection', query);

			expect(result).toEqual({
				total_count: 100,
				filter_count: 50,
			});
		});

		test('should handle unknown meta values as undefined', async () => {
			const query = { meta: ['unknown_meta'] };
			const result = await service.getMetaForQuery('test_collection', query);

			expect(result).toEqual({ unknown_meta: undefined });
		});

		test('should handle mixed known and unknown meta values', async () => {
			vi.spyOn(service, 'totalCount').mockResolvedValue(100);

			const query = { meta: ['total_count', 'unknown_meta'] };
			const result = await service.getMetaForQuery('test_collection', query);

			expect(result).toEqual({
				total_count: 100,
				unknown_meta: undefined,
			});
		});
	});

	describe('totalCount', () => {
		let service: MetaService;

		const mockAccountability = createDefaultAccountability({
			admin: false,
		});

		beforeEach(() => {
			vi.clearAllMocks();

			service = new MetaService({
				knex: db,
				accountability: mockAccountability,
				schema: mockSchema,
			});
		});

		test('should call filterCount with empty query', async () => {
			vi.spyOn(service, 'filterCount').mockResolvedValue(150);

			const result = await service.totalCount('test_collection');

			expect(service.filterCount).toHaveBeenCalledWith('test_collection', {});
			expect(result).toBe(150);
		});
	});

	describe('filterCount', () => {
		const createMockQueryBuilder = (
			value: { count?: number | null } | { count: number | null }[] = [{ count: 10 }],
		) => {
			const mockQueryBuilder = Promise.resolve(value) as any;
			mockQueryBuilder.count = vi.fn().mockReturnValue(mockQueryBuilder);
			mockQueryBuilder.countDistinct = vi.fn().mockReturnValue(mockQueryBuilder);

			return mockQueryBuilder;
		};

		beforeEach(() => {
			vi.clearAllMocks();
		});

		test('should handle admin user without permission checks', async () => {
			const mockAccountability = createDefaultAccountability({
				admin: true,
			});

			const service = new MetaService({
				knex: db,
				accountability: mockAccountability,
				schema: mockSchema,
			});

			vi.mocked(getCases).mockReturnValue({ cases: [], caseMap: {}, allowedFields: new Set() });

			vi.mocked(applyQuery).mockReturnValue({
				query: createMockQueryBuilder() as any,
				hasJoins: false,
				hasMultiRelationalFilter: false,
			});

			const result = await service.filterCount('test_collection', { filter: { status: { _eq: 'published' } } });

			expect(validateAccess).not.toHaveBeenCalled();
			expect(fetchPolicies).not.toHaveBeenCalled();
			expect(fetchPermissions).not.toHaveBeenCalled();
			expect(result).toBe(10);
		});

		test('should handle null accountability without permission checks', async () => {
			const service = new MetaService({
				knex: db,
				accountability: null,
				schema: mockSchema,
			});

			vi.mocked(getCases).mockReturnValue({ cases: [], caseMap: {}, allowedFields: new Set() });

			vi.mocked(applyQuery).mockReturnValue({
				query: createMockQueryBuilder() as any,
				hasJoins: false,
				hasMultiRelationalFilter: false,
			});

			const result = await service.filterCount('test_collection', { filter: { status: { _eq: 'published' } } });

			expect(validateAccess).not.toHaveBeenCalled();
			expect(fetchPolicies).not.toHaveBeenCalled();
			expect(fetchPermissions).not.toHaveBeenCalled();
			expect(result).toBe(10);
		});

		test('should perform permission checks for non-admin users', async () => {
			const mockPolicies = ['policy-1'];

			const mockPermissions: Permission[] = [
				{
					id: 1,
					collection: 'test_collection',
					action: 'read',
					permissions: {},
					validation: {},
					presets: {},
					fields: ['*'],
					policy: 'policy-1',
				},
			];

			const mockAccountability = createDefaultAccountability({
				admin: false,
			});

			const service = new MetaService({
				knex: db,
				accountability: mockAccountability,
				schema: mockSchema,
			});

			vi.mocked(validateAccess).mockResolvedValue(undefined);
			vi.mocked(fetchPolicies).mockResolvedValue(mockPolicies);
			vi.mocked(fetchPermissions).mockResolvedValue(mockPermissions);

			vi.mocked(getCases).mockReturnValue({ cases: [], caseMap: {}, allowedFields: new Set() });

			vi.mocked(applyQuery).mockReturnValue({
				query: createMockQueryBuilder() as any,
				hasJoins: false,
				hasMultiRelationalFilter: false,
			});

			const result = await service.filterCount('test_collection', { filter: { status: { _eq: 'published' } } });

			expect(validateAccess).toHaveBeenCalledWith(
				{
					accountability: mockAccountability,
					action: 'read',
					collection: 'test_collection',
				},
				{ knex: db, schema: mockSchema },
			);

			expect(fetchPolicies).toHaveBeenCalledWith(mockAccountability, { knex: db, schema: mockSchema });

			expect(fetchPermissions).toHaveBeenCalledWith(
				{ action: 'read', accountability: mockAccountability, policies: mockPolicies },
				{ knex: db, schema: mockSchema },
			);

			expect(result).toBe(10);
		});

		test('should propagate validateAccess errors', async () => {
			const mockAccountability = createDefaultAccountability({ admin: false });

			const service = new MetaService({
				knex: db,
				accountability: mockAccountability,
				schema: mockSchema,
			});

			const mockError = new ForbiddenError({ reason: 'No access' });
			vi.mocked(validateAccess).mockRejectedValue(mockError);

			await expect(service.filterCount('test_collection', {})).rejects.toThrow(mockError);

			expect(fetchPolicies).not.toHaveBeenCalled();
			expect(applyQuery).not.toHaveBeenCalled();
		});

		test('should use countDistinct when query has joins', async () => {
			vi.mocked(getCases).mockReturnValue({ cases: [], caseMap: {}, allowedFields: new Set() });

			const mockQueryBuilder = createMockQueryBuilder();

			vi.mocked(applyQuery).mockReturnValue({
				query: mockQueryBuilder,
				hasJoins: true,
				hasMultiRelationalFilter: false,
			});

			const service = new MetaService({
				knex: db,
				schema: mockSchema,
			});

			const result = await service.filterCount('test_collection', { filter: { status: { _eq: 'published' } } });

			expect(mockQueryBuilder.countDistinct).toHaveBeenCalledWith({
				count: ['test_collection.id'],
			});

			expect(mockQueryBuilder.count).not.toHaveBeenCalled();
			expect(result).toBe(10);
		});

		test('should use regular count when query has no joins', async () => {
			vi.mocked(getCases).mockReturnValue({ cases: [], caseMap: {}, allowedFields: new Set() });

			const mockQueryBuilder = createMockQueryBuilder();

			vi.mocked(applyQuery).mockReturnValue({
				query: mockQueryBuilder,
				hasJoins: false,
				hasMultiRelationalFilter: false,
			});

			const service = new MetaService({
				knex: db,
				schema: mockSchema,
			});

			const result = await service.filterCount('test_collection', { filter: { status: { _eq: 'published' } } });

			expect(mockQueryBuilder.count).toHaveBeenCalledWith('*', { as: 'count' });
			expect(mockQueryBuilder.countDistinct).not.toHaveBeenCalled();
			expect(result).toBe(10);
		});

		test('should handle array result from database', async () => {
			vi.mocked(getCases).mockReturnValue({ cases: [], caseMap: {}, allowedFields: new Set() });

			const mockQueryBuilder = createMockQueryBuilder([{ count: 15 }]);

			vi.mocked(applyQuery).mockReturnValue({
				query: mockQueryBuilder,
				hasJoins: true,
				hasMultiRelationalFilter: false,
			});

			const service = new MetaService({
				knex: db,
				schema: mockSchema,
			});

			const result = await service.filterCount('test_collection', { filter: { status: { _eq: 'published' } } });
			expect(result).toBe(15);
		});

		test('should handle non-array result from database', async () => {
			vi.mocked(getCases).mockReturnValue({ cases: [], caseMap: {}, allowedFields: new Set() });

			const mockQueryBuilder = createMockQueryBuilder({ count: 30 });

			vi.mocked(applyQuery).mockReturnValue({
				query: mockQueryBuilder as any,
				hasJoins: false,
				hasMultiRelationalFilter: false,
			});

			const service = new MetaService({
				knex: db,
				schema: mockSchema,
			});

			const result = await service.filterCount('test_collection', { filter: { status: { _eq: 'published' } } });
			expect(result).toBe(30);
		});

		describe('should return 0 when count is null or undefined', () => {
			test.each([0, null])('%s', async (count) => {
				vi.mocked(getCases).mockReturnValue({ cases: [], caseMap: {}, allowedFields: new Set() });

				const mockQueryBuilder = createMockQueryBuilder({ count });

				vi.mocked(applyQuery).mockReturnValue({
					query: mockQueryBuilder as any,
					hasJoins: false,
					hasMultiRelationalFilter: false,
				});

				const service = new MetaService({
					knex: db,
					schema: mockSchema,
				});

				const result = await service.filterCount('test_collection', {});
				expect(result).toBe(0);
			});
		});

		test('should handle empty array result', async () => {
			vi.mocked(getCases).mockReturnValue({ cases: [], caseMap: {}, allowedFields: new Set() });

			const mockQueryBuilder = createMockQueryBuilder([]);

			vi.mocked(applyQuery).mockReturnValue({
				query: mockQueryBuilder as any,
				hasJoins: true,
				hasMultiRelationalFilter: false,
			});

			const service = new MetaService({
				knex: db,
				schema: mockSchema,
			});

			const result = await service.filterCount('test_collection', {});
			expect(result).toBe(0);
		});

		test('should pass correct parameters to applyQuery', async () => {
			const mockCases = [{}];

			vi.mocked(getCases).mockReturnValue({ cases: mockCases, caseMap: {}, allowedFields: new Set() });

			const mockQueryBuilder = createMockQueryBuilder();

			vi.mocked(applyQuery).mockReturnValue({
				query: mockQueryBuilder,
				hasJoins: false,
				hasMultiRelationalFilter: false,
			});

			const service = new MetaService({
				knex: db,
				schema: mockSchema,
			});

			const query: Query = {
				filter: { status: { _eq: 'published' } },
				search: 'test search',
			};

			await service.filterCount('test_collection', query);

			expect(applyQuery).toHaveBeenCalledWith(
				db,
				'test_collection',
				db('test_collection'),
				query,
				mockSchema,
				mockCases,
				[],
			);
		});

		test('should handle query with null filter and search', async () => {
			vi.mocked(getCases).mockReturnValue({ cases: [], caseMap: {}, allowedFields: new Set() });

			const mockQueryBuilder = createMockQueryBuilder();

			vi.mocked(applyQuery).mockReturnValue({
				query: mockQueryBuilder,
				hasJoins: false,
				hasMultiRelationalFilter: false,
			});

			const service = new MetaService({
				knex: db,
				schema: mockSchema,
			});

			await service.filterCount('test_collection', {});

			expect(applyQuery).toHaveBeenCalledWith(
				db,
				'test_collection',
				db('test_collection'),
				{
					filter: null,
					search: null,
				},
				mockSchema,
				[],
				[],
			);
		});
	});
});
