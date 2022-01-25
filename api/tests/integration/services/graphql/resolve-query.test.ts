import { ResolveQuery } from '../../../../src/services/graphql/resolve-query';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { userSchema } from '../../../__test-utils__/schemas';
import knex from 'knex';
import { cloneDeep } from 'lodash';
import { info, aggregationInfo, noSelections } from '../../../__test-utils__/gql-queries';

jest.mock('../../../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../../../src/database/index');

describe('Class ResolveQuery', () => {
	const mockKnex = knex({ client: MockClient });
	let tracker: Tracker;

	beforeAll(() => {
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('resolveQuery()', () => {
		it.only('returns the readByQuery mock when not a singleton', async () => {
			tracker.on.select('authors').responseOnce({});

			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema: userSchema,
			});
			const response = await adminResolver.resolveQuery(info, 'user');

			expect(response).toStrictEqual({});

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual([100]);
		});

		it('returns the readBySingleton mock when a singleton', async () => {
			const schema = cloneDeep(userSchema);
			schema.collections.authors.singleton = true;

			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema,
			});

			expect(await adminResolver.resolveQuery(info, 'user')).toStrictEqual({ singleton: true });
		});

		it('returns null when theres no selections', async () => {
			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema: userSchema,
			});
			expect(await adminResolver.resolveQuery(noSelections, 'user')).toBe(null);
		});

		it('returns the aggregation query', async () => {
			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema: userSchema,
			});

			expect(await adminResolver.resolveQuery(aggregationInfo, 'user')).toStrictEqual({ singleton: false });
		});
	});
});
