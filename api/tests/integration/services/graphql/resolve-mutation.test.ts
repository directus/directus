import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { userSchema } from '../../../__test-utils__/schemas';
import { ResolveMutation } from '../../../../src/services/graphql/resolve-mutation';
import { info } from '../../../__test-utils__/gql-queries';
import * as ItemsService from '../../../../src/services/items';
import * as GetService from '../../../../src/services/graphql/shared/get-service';
import { Item, AbstractServiceOptions } from '../../../../src/types';

jest.mock('../../../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});

describe('Class ResolveMutation', () => {
	const mockKnex = knex({ client: MockClient });
	// mock class ItemsService to see which functions are called and what args they are passed

	describe('resolveMutation()', () => {
		let get: jest.SpyInstance<ItemsService.ItemsService<Item>, [options: AbstractServiceOptions, collection: string]>;
		let itemService: jest.SpyInstance<
			ItemsService.ItemsService<Item>,
			[collection: string, options: AbstractServiceOptions]
		>;

		beforeEach(() => {
			itemService = jest.spyOn(ItemsService, 'ItemsService').mockReturnValue({
				readByQuery: { readByQuery: true },
				upsertSingleton: { upsertSingleton: true },
				readSingleton: { readSingleton: true },
			} as any);
		});

		afterEach(() => {
			// get.mockRestore();
			itemService.mockRestore();
		});

		it('', () => {
			const options = { knex: mockKnex, accountability: { admin: true, role: 'admin' }, schema: userSchema };
			const resolver = new ResolveMutation(options);
			resolver.resolveMutation({}, info, 'user');

			expect(itemService.mock.calls.length).toBe(1);
			expect(itemService.mock.calls[0][0]).toStrictEqual('');

			expect(itemService.mock.results.length).toBe(1);
			expect(itemService.mock.results).toBe([
				{
					type: 'return',
					value: {
						readByQuery: true,
						readSingleton: true,
						upsertSingleton: true,
					},
				},
			]);

			expect(itemService.mock.instances.length).toBe(1);
			expect(itemService.mock.instances).toBe(1);
		});
	});
});
