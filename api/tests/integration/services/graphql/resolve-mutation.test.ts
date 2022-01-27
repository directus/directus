import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { ResolveMutation } from '../../../../src/services/graphql/resolve-mutation';
import { ItemsService } from '../../../../src/services/items';
import { systemSchema, userSchema } from '../../../__test-utils__/schemas';
import { createManyQuery } from '../../../__test-utils__/gql-queries';

jest.mock('../../../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});

describe('Class ResolveMutation', () => {
	const mockKnex = knex({ client: MockClient });

	const scopes: Record<string, any> = {
		system: { schema: systemSchema, tables: Object.keys(systemSchema.collections) },
		items: { schema: userSchema, tables: Object.keys(userSchema.collections) },
	};

	describe('resolveMutation()', () => {
		const options = { knex: mockKnex, accountability: { admin: true, role: 'admin' }, schema: userSchema };
		let resolver: ResolveMutation;
		let createMany: any;

		beforeEach(() => {
			createMany = jest.spyOn(ItemsService.prototype, 'createMany').mockResolvedValue(['id']);
		});

		afterEach(() => {
			createMany.mockRestore();
		});
		describe(' createMany with no args', () => {
			it.each(Object.keys(scopes))('%s', (scope) => {
				const table = scopes[scope].tables[0];

				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				resolver.resolveMutation({}, createManyQuery(table), scope);
				expect(createMany.mock.calls.length).toBe(1);

				// check that args aren't passed
				expect(createMany.mock.calls[0][0]).toStrictEqual(undefined);

				// Need to figure out was results /should/ be
				expect(createMany.mock.results.length).toBe(1);
			});
		});
	});
});
