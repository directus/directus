import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { GraphQLService } from '../../../../src/services/graphql/graphql';
import { AbstractServiceOptions } from '../../../../src/types';
import { userSchema } from '../../../__test-utils__/schemas';

describe('', () => {
	const mockKnex = knex({ client: MockClient });
	const options = {
		knex: mockKnex,
		accountability: { admin: true, role: 'admin' },
		schema: userSchema,
		scope: 'items',
	} as AbstractServiceOptions & { scope: 'items' | 'system' };

	const gql = new GraphQLService(options);
	it('', () => {
		gql.execute();
		expect().toBe('');
	});
});
