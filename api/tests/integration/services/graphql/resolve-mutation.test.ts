import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { ResolveMutation } from '../../../../src/services/graphql/resolve-mutation';
import { userSchema } from '../../../__test-utils__/schemas';
import { createOneQuery } from '../../../__test-utils__/gql-queries';

jest.mock('../../../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../../../src/database/index');
describe('Class ResolveMutation', () => {
	const mockKnex = knex({ client: MockClient });
	// mock class ItemsService to see which functions are called and what args they are passed

	// describe('resolveMutation()', ()=>{
	//  const resolver = new ResolveMutation({knex: mockKnex, accountability: {admin: true, role: "admin"}, schema: userSchema})
	// 	it('', async () => {
	// 		const response = await resolver.resolveMutation({fields: ["id"]}, createOneQuery, 'user')
	// 		expect(response).toBeCalledTimes(1)
	// 	})
	// })
});
