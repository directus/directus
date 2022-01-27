import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { userSchema } from '../../../__test-utils__/schemas';
import { ResolveMutation } from '../../../../src/services/graphql/resolve-mutation';
import { createManyQuery } from '../../../__test-utils__/gql-queries';
import { ItemsService } from '../../../../src/services/items';
jest.mock('../../../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});

describe('Class ResolveMutation', () => {
	const mockKnex = knex({ client: MockClient });

	describe('resolveMutation()', () => {
		const options = { knex: mockKnex, accountability: { admin: true, role: 'admin' }, schema: userSchema };
		let resolver: ResolveMutation;
		let createMany: any;

		beforeAll(() => {
			createMany = jest.spyOn(ItemsService.prototype, 'createMany').mockResolvedValue(['id']);
			resolver = new ResolveMutation(options);
		});

		afterEach(() => {
			createMany.mockRestore();
		});

		it('createMany with no args', () => {
			resolver.resolveMutation({}, createManyQuery, 'user');
			expect(createMany.mock.calls.length).toBe(1);

			// check that args aren't passed
			expect(createMany.mock.calls[0][0]).toStrictEqual(undefined);

			// Need to figure out was results /should/ be
			expect(createMany.mock.results.length).toBe(1);
		});
	});
});
