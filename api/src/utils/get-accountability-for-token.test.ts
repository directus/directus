import { useEnv } from '@directus/env';
import jwt from 'jsonwebtoken';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi, type MockedFunction } from 'vitest';
import { getAccountabilityForToken } from './get-accountability-for-token.js';
import knex, { Knex } from 'knex';
import { Tracker, MockClient, createTracker } from 'knex-mock-client';
import getDatabase from '../database/index.js';
import type { Accountability } from '@directus/types';

vi.mock('@directus/env');
vi.mock('../database/index.js');

let db: MockedFunction<Knex>;
let tracker: Tracker;

beforeAll(async () => {
	db = vi.mocked(knex.default({ client: MockClient }));
	tracker = createTracker(db);

	vi.mocked(getDatabase).mockReturnValue(db);
});

afterEach(() => {
	tracker.reset();
	vi.clearAllMocks();
});

const mockSecret = 'super-secure-secret';

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({
		SECRET: mockSecret,
		EXTENSIONS_PATH: './extensions',
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('No token', () => {
	test('Returns default accountability', async () => {
		const result = await getAccountabilityForToken();

		expect(result).toStrictEqual({ user: null, role: null, admin: false, app: false });
	});

	test('Uses passed-in accountability object', async () => {
		const accountability = {} as Accountability;

		const result = await getAccountabilityForToken(null, accountability);

		expect(result).toBe(accountability);
	});
});

describe('JWT', () => {
	test('Minimal token payload', async () => {
		const token = jwt.sign({ role: '123-456-789', admin_access: true, app_access: false }, mockSecret, {
			issuer: 'directus',
		});

		const result = await getAccountabilityForToken(token);

		expect(result).toStrictEqual({ role: '123-456-789', user: null, admin: true, app: false });
	});

	test('Token with numeric access properties', async () => {
		const token = jwt.sign({ role: '123-456-789', admin_access: 1, app_access: 0 }, mockSecret, {
			issuer: 'directus',
		});

		const result = await getAccountabilityForToken(token);

		expect(result).toStrictEqual({ role: '123-456-789', user: null, admin: true, app: false });
	});

	test('Token with stringified numeric access properties', async () => {
		const token = jwt.sign({ role: '123-456-789', admin_access: '1', app_access: '0' }, mockSecret, {
			issuer: 'directus',
		});

		const result = await getAccountabilityForToken(token);

		expect(result).toStrictEqual({ role: '123-456-789', user: null, admin: true, app: false });
	});

	test('Full token payload', async () => {
		const token = jwt.sign(
			{
				share: 'share-id',
				share_scope: 'share-scope',
				id: 'user-id',
				role: 'role-id',
				admin_access: true,
				app_access: true,
			},
			mockSecret,
			{ issuer: 'directus' },
		);

		const result = await getAccountabilityForToken(token);

		expect(result).toEqual({
			admin: true,
			app: true,
			user: 'user-id',
			role: 'role-id',
			share: 'share-id',
			share_scope: 'share-scope',
		});
	});

	test('Throws when token has expired', async () => {
		const token = jwt.sign({ role: '123-456-789' }, mockSecret, { issuer: 'directus', expiresIn: -1 });

		expect(() => getAccountabilityForToken(token)).rejects.toThrow('Token expired.');
	});

	test('Throws when token is invalid', async () => {
		const token = jwt.sign({ role: '123-456-789' }, 'bad-secret', { issuer: 'directus' });

		expect(() => getAccountabilityForToken(token)).rejects.toThrow('Invalid token.');
	});
});

describe('Static Token', () => {
	test('Find user in database', async () => {
		tracker.on.select('select').response([
			{
				id: 'user-id',
				role: 'role-id',
				admin_access: false,
				app_access: true,
			},
		]);

		const token = 'static-token';

		const result = await getAccountabilityForToken(token);

		expect(result).toStrictEqual({
			user: 'user-id',
			role: 'role-id',
			admin: false,
			app: true,
		});
	});

	test('Casts numeric access properties', async () => {
		tracker.on.select('select').response([
			{
				id: 'user-id',
				role: 'role-id',
				admin_access: 0,
				app_access: 1,
			},
		]);

		const token = 'static-token';

		const result = await getAccountabilityForToken(token);

		expect(result).toStrictEqual({
			user: 'user-id',
			role: 'role-id',
			admin: false,
			app: true,
		});
	});

	test('Casts stringified numeric access properties', async () => {
		tracker.on.select('select').response([
			{
				id: 'user-id',
				role: 'role-id',
				admin_access: '0',
				app_access: '1',
			},
		]);

		const token = 'static-token';

		const result = await getAccountabilityForToken(token);

		expect(result).toStrictEqual({
			user: 'user-id',
			role: 'role-id',
			admin: false,
			app: true,
		});
	});

	test('Throws when user does not exist', async () => {
		tracker.on.select('select').response([]);

		const token = 'invalid-static-token';

		expect(() => getAccountabilityForToken(token)).rejects.toThrow('Invalid user credentials.');
	});
});
