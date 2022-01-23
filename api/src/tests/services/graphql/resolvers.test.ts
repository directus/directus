import { Resolvers } from '../../../services/graphql/resolvers';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
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

describe('Class Resolvers', () => {
	let tracker: Tracker;
	const mockKnex = knex({ client: MockClient });
	beforeAll(() => {
		tracker = getTracker();
	});
	afterEach(() => {
		tracker.reset();
	});
	describe('read', () => {
		it('readSingleton', async () => {
			const schema = cloneDeep(userSchema);
			schema.collections.authors.singleton = true;

			const adminResolvers = new Resolvers({ knex: mockKnex, accountabilty: { admin: true, role: 'admin' }, schema });

			const result = await adminResolvers.read('authors', {});
			expect(result).toStrictEqual({ singleton: true });
		});

		it('readByQuery', async () => {
			const adminResolvers = new Resolvers({
				knex: mockKnex,
				accountabilty: { admin: true, role: 'admin' },
				schema: userSchema,
			});

			const result = await adminResolvers.read('authors', {});
			expect(result).toStrictEqual({ singleton: false });
		});
	});
});
