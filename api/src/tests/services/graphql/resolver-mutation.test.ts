import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { cloneDeep } from 'lodash';
import { ResolveMutation } from '../../../services/graphql/resolve-mutation';
import { userSchema } from '../../__test-utils__/schemas';

jest.mock('../../../services/', () => {
	return {
		ItemsService: jest.fn().mockReturnValue({
			readSingleton: jest.fn().mockReturnValue({ itsHit: true }),
			upsertSingleton: jest.fn().mockReturnValue({}),
		}),
	};
});

// jest.mock('../../../services/graphql/shared/get-service', () => {})
describe('Class ResolveMutation', () => {
	const mockKnex = knex({ client: MockClient });

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
			expect(result).toStrictEqual({ itsHit: true });
		});
	});
});
