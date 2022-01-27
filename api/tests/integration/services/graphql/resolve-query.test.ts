import { ResolveQuery } from '../../../../src/services/graphql/resolve-query';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { userSchema } from '../../../__test-utils__/schemas';
import knex from 'knex';
import { cloneDeep } from 'lodash';
import { aggregationInfo, info, noSelections } from '../../../__test-utils__/gql-queries';

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
		// update these to use spyOn() to make sure singleton/readbyQuery calledOnce()
		it('calls readByQuery when not a singleton', async () => {
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

		it('calls readBySingleton when a singleton', async () => {
			tracker.on.select('authors').responseOnce({});

			const schema = cloneDeep(userSchema);
			schema.collections.authors.singleton = true;

			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema,
			});
			const response = await adminResolver.resolveQuery(info, 'user');

			expect(response).toStrictEqual({});

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual([1]);
		});

		it('returns null when theres no selections', async () => {
			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema: userSchema,
			});
			expect(await adminResolver.resolveQuery(noSelections, 'user')).toBe(null);
		});

		// update this to use spyOn() to make sure singleton/readbyQuery are passed the right query?
		it('returns the aggregated value(default values) when a singleton.', async () => {
			tracker.on.select('authors').responseOnce({});

			const schema = cloneDeep(userSchema);
			schema.collections.authors.singleton = true;

			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema,
			});
			const response = await adminResolver.resolveQuery(aggregationInfo, 'user');

			expect(response).toStrictEqual({ id: null, name: "An Author's Name" });

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual([1]);
		});
	});
});
