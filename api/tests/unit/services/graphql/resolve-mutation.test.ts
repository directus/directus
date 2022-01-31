import { Query } from '@directus/shared/types';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { cloneDeep } from 'lodash';
import { ResolveMutation } from '../../../../src/services/graphql/resolve-mutation';
import { ItemsService, QueryOptions } from '../../../../src/services/items';
import { PrimaryKey, MutationOptions } from '../../../../src/types';
import { userSchema } from '../../../__test-utils__/schemas';

jest.mock('../../../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});

describe('Class ResolveMutation', () => {
	let readSingleton: jest.SpyInstance<Promise<Partial<any>>, [query: Query, opts?: QueryOptions]>;
	let upsertSingleton: jest.SpyInstance<Promise<PrimaryKey>, [data: Partial<any>, opts?: MutationOptions]>;
	const mockKnex = knex({ client: MockClient });

	beforeEach(() => {
		readSingleton = jest.spyOn(ItemsService.prototype, 'readSingleton').mockResolvedValue({ id: 1 });
		upsertSingleton = jest.spyOn(ItemsService.prototype, 'upsertSingleton').mockResolvedValue(1);
	});

	afterEach(() => {
		readSingleton.mockRestore();
		upsertSingleton.mockRestore();
	});

	describe('upsertSingleton', () => {
		const schema = cloneDeep(userSchema);
		schema.collections.authors.singleton = true;

		const adminResolver = new ResolveMutation({
			knex: mockKnex,
			accountability: { admin: true, role: 'admin' },
			schema,
		});

		it('returns true when not given query fields', async () => {
			const result = await adminResolver.upsertSingleton('authors', {}, {});
			expect(result).toBe(true);
		});

		it('returns readSingleton(query) when there are query fields', async () => {
			const result = await adminResolver.upsertSingleton('authors', {}, { fields: ['name'] });
			expect(result).toStrictEqual({ id: 1 });
		});
	});
});
