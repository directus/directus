import { ResolveQuery } from '../../../../src/services/graphql/resolve-query';
import { MockClient } from 'knex-mock-client';
import { userSchema } from '../../../__test-utils__/schemas';
import knex from 'knex';
import { cloneDeep } from 'lodash';
import { ItemsService, QueryOptions } from '../../../../src/services/items';
import { Query } from '@directus/shared/types';

jest.mock('../../../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});

describe('Class ResolveQuery', () => {
	const mockKnex = knex({ client: MockClient });
	let readSingleton: jest.SpyInstance<Promise<Partial<any>>, [query: Query, opts?: QueryOptions]>;
	let readByQuery: jest.SpyInstance<Promise<any[]>, [query: Query, opts?: QueryOptions]>;

	beforeEach(() => {
		readSingleton = jest.spyOn(ItemsService.prototype, 'readSingleton').mockResolvedValue({ id: 1 });
		readByQuery = jest.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue(['id']);
	});

	afterEach(() => {
		readSingleton.mockRestore();
		readByQuery.mockRestore();
	});

	describe('read', () => {
		it('readSingleton', async () => {
			const schema = cloneDeep(userSchema);
			schema.collections.authors.singleton = true;

			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema,
			});

			const result = await adminResolver.read('authors', {});
			expect(result).toStrictEqual({ singleton: true });
		});

		it('readByQuery', async () => {
			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema: userSchema,
			});

			const result = await adminResolver.read('authors', {});
			expect(result).toStrictEqual({ singleton: false });
		});
	});

	describe('getAggregateQuery', () => {
		const adminResolvers = new ResolveQuery({
			knex: mockKnex,
			accountability: { admin: true, role: 'admin' },
			schema: userSchema,
		});
		it('__type is ignored in the aggregate query', async () => {
			const result = await adminResolvers.getAggregateQuery({ aggregate: { sum: ['name'] } }, [
				{
					kind: 'Field',
					name: { kind: 'Name', value: '__type' },
				},
			]);
			expect(result).toStrictEqual({ aggregate: {} });
		});

		it('sum works', async () => {
			const result = await adminResolvers.getAggregateQuery({ aggregate: { sum: ['WowAUniqueInlineFragment'] } }, [
				{
					kind: 'Field',
					name: { kind: 'Name', value: 'WowAUniqueInlineFragment' },
				},
			]);
			expect(result).toStrictEqual({ aggregate: { WowAUniqueInlineFragment: [] } });
		});

		it("doesn't fail when accountability is null", async () => {
			const nullAccountability = new ResolveQuery({
				knex: mockKnex,
				accountability: null,
				schema: userSchema,
			});
			const result = await nullAccountability.getAggregateQuery({ aggregate: { sum: ['WowAUniqueInlineFragment'] } }, [
				{
					kind: 'Field',
					name: { kind: 'Name', value: 'WowAUniqueInlineFragment' },
				},
			]);
			expect(result).toStrictEqual({ aggregate: { WowAUniqueInlineFragment: [] } });
		});
	});
});
