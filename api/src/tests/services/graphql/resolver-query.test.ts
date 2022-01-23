import { ResolveQuery } from '../../../services/graphql/resolve-query';
import { MockClient } from 'knex-mock-client';
import { userSchema } from '../../__test-utils__/schemas';
import knex from 'knex';
import { cloneDeep } from 'lodash';

jest.mock('../../../database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../../database/index');

jest.mock('../../../services/', () => {
	return {
		ItemsService: jest.fn().mockReturnValue({
			readSingleton: jest.fn().mockReturnValue({ singleton: true }),
			readByQuery: jest.fn().mockReturnValue({ singleton: false }),
		}),
		ActivityService: jest.fn().mockReturnThis(),
		FilesService: jest.fn().mockReturnThis(),
		FoldersService: jest.fn().mockReturnThis(),
		PermissionsService: jest.fn().mockReturnThis(),
		PresetsService: jest.fn().mockReturnThis(),
		NotificationsService: jest.fn().mockReturnThis(),
		RevisionsService: jest.fn().mockReturnThis(),
		RolesService: jest.fn().mockReturnThis(),
		SettingsService: jest.fn().mockReturnThis(),
		UsersService: jest.fn().mockReturnThis(),
		WebhooksService: jest.fn().mockReturnThis(),
		SharesService: jest.fn().mockReturnThis(),
	};
});

describe('Class ResolveQuery', () => {
	const mockKnex = knex({ client: MockClient });

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
