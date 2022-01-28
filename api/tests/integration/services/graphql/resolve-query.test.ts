import { ResolveQuery } from '../../../../src/services/graphql/resolve-query';
import { MockClient } from 'knex-mock-client';
import { systemSchema, userSchema } from '../../../__test-utils__/schemas';
import knex from 'knex';
import { cloneDeep } from 'lodash';
import { aggregationInfo, argsById, info, noSelections } from '../../../__test-utils__/gql-queries';
import { Query } from '@directus/shared/types';
import { ItemsService, QueryOptions } from '../../../../src/services/items';

jest.mock('../../../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../../../src/database/index');

describe('Class ResolveQuery', () => {
	const mockKnex = knex({ client: MockClient });

	const scopes: Record<string, any> = {
		system: { schema: systemSchema, tables: Object.keys(systemSchema.collections) },
		items: { schema: userSchema, tables: Object.keys(userSchema.collections) },
	};

	describe('resolveQuery()', () => {
		let readSingleton: jest.SpyInstance<Promise<Partial<any>>, [query: Query, opts?: QueryOptions]>;
		let readByQuery: jest.SpyInstance<Promise<any[]>, [query: Query, opts?: QueryOptions]>;

		beforeEach(() => {
			readSingleton = jest.spyOn(ItemsService.prototype, 'readSingleton');
			readByQuery = jest.spyOn(ItemsService.prototype, 'readByQuery');
		});

		afterEach(() => {
			readSingleton.mockRestore();
			readByQuery.mockRestore();
		});

		describe('calls readByQuery when not a singleton', () => {
			it.each(Object.keys(scopes))('%s', async (scope) => {
				let table: string = scopes[scope].tables[0];
				readByQuery.mockResolvedValueOnce(['readByQuery']);

				const adminResolver = new ResolveQuery({
					knex: mockKnex,
					accountability: { admin: true, role: 'admin' },
					schema: scopes[scope].schema,
				});

				if (scope === 'system') table = table.substring(9);

				const response = await adminResolver.resolveQuery(info(table), scope);

				expect(readByQuery.mock.calls.length).toBe(1);
				expect(readByQuery.mock.calls[0].length).toBe(2);
				expect(readByQuery.mock.calls[0][0]).toStrictEqual({ alias: {}, fields: ['date'], filter: undefined });
				expect(readByQuery.mock.calls[0][1]).toStrictEqual({ stripNonRequested: false });

				expect(response).toStrictEqual(['readByQuery']);
			});
		});

		describe('calls readBySingleton when a singleton', () => {
			it.each(Object.keys(scopes))('%s', async (scope) => {
				let table: string = scopes[scope].tables[0];
				readSingleton.mockResolvedValueOnce(['readSingleton']);

				const schema = cloneDeep(scopes[scope].schema);
				schema.collections[table].singleton = true;

				if (scope === 'system') table = table.substring(9);

				const adminResolver = new ResolveQuery({
					knex: mockKnex,
					accountability: { admin: true, role: 'admin' },
					schema,
				});

				const response = await adminResolver.resolveQuery(info(table), scope);

				expect(readSingleton.mock.calls.length).toBe(1);
				expect(readSingleton.mock.calls[0].length).toBe(2);
				expect(readSingleton.mock.calls[0][0]).toStrictEqual({ alias: {}, fields: ['date'], filter: undefined });
				expect(readSingleton.mock.calls[0][1]).toStrictEqual({ stripNonRequested: false });

				expect(response).toStrictEqual(['readSingleton']);
			});
		});

		describe('_by_id', () => {
			it.each(Object.keys(scopes))('%s', async (scope) => {
				let table: string = scopes[scope].tables[0];
				readByQuery.mockResolvedValueOnce(['readByQuery']);

				if (scope === 'system') table = table.substring(9);
				table = `${table}_by_id`;

				const adminResolver = new ResolveQuery({
					knex: mockKnex,
					accountability: { admin: true, role: 'admin' },
					schema: scopes[scope].schema,
				});

				const response = await adminResolver.resolveQuery(argsById(table), scope);

				expect(readByQuery.mock.calls.length).toBe(1);
				expect(readByQuery.mock.calls[0].length).toBe(2);
				expect(readByQuery.mock.calls[0][0]).toStrictEqual({
					alias: {},
					fields: ['date'],
					filter: {
						_and: [
							{},
							{
								id: {
									_eq: ['id'],
								},
							},
						],
					},
					limit: 1,
				});
				expect(readByQuery.mock.calls[0][1]).toStrictEqual({ stripNonRequested: false });
				expect(response).toStrictEqual('readByQuery');
			});
		});

		it('returns null when theres no selections', async () => {
			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema: userSchema,
			});
			expect(await adminResolver.resolveQuery(noSelections, 'user')).toBe(null);
		});

		// update this to use spyOn() to make sure singleton/readbyQuery are passed the right query?
		it('returns the aggregated value when a singleton.', async () => {
			readSingleton.mockResolvedValueOnce(['readSingleton']);

			const schema = cloneDeep(userSchema);
			schema.collections.authors.singleton = true;

			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema,
			});
			const response = await adminResolver.resolveQuery(aggregationInfo, 'user');

			expect(readSingleton.mock.calls.length).toBe(1);
			expect(readSingleton.mock.calls[0].length).toBe(2);
			expect(readSingleton.mock.calls[0][0]).resolves.toStrictEqual({
				aggregate: {
					date: [],
				},
			});
			expect(readSingleton.mock.calls[0][1]).toStrictEqual({ stripNonRequested: false });

			expect(response).toStrictEqual(['readSingleton']);
		});
	});
});
