import { InvalidCredentialsError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import knex from 'knex';
import { MockClient, Tracker, createTracker } from 'knex-mock-client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import getDatabase from '../database/index.js';
import type { DirectusTokenPayload } from '../types/auth.js';
import { getAccountabilityForToken } from './get-accountability-for-token.js';
import isDirectusJWT from './is-directus-jwt.js';
import { verifyAccessJWT } from './jwt.js';
import { verifySessionJWT } from './verify-session-jwt.js';

vi.mock('../database/index');
vi.mock('./jwt');
vi.mock('./is-directus-jwt');
vi.mock('./verify-session-jwt');

afterEach(() => {
	vi.resetAllMocks();
});

describe('No token', () => {
	const token = null;

	test('Return default accountability', async () => {
		const result = await getAccountabilityForToken(token);

		expect(result).toStrictEqual({ user: null, role: null, admin: false, app: false });
	});

	test('Use passed-in accountability object', async () => {
		const accountability = {} as Accountability;

		const result = await getAccountabilityForToken(token, accountability);

		expect(result).toBe(accountability);
	});
});

describe('JWT', () => {
	const token = 'mock-token';

	beforeEach(() => {
		vi.mocked(isDirectusJWT).mockReturnValue(true);
	});

	test('Map token payload to accountability', async () => {
		const jwtPayload = {
			id: 'user-id',
			role: 'role-id',
			admin_access: true,
			app_access: true,
			share: 'share-id',
			share_scope: { collection: 'collection', item: 'item' },
		};

		vi.mocked(verifyAccessJWT).mockReturnValue(jwtPayload);

		const result = await getAccountabilityForToken(token);

		expect(result).toEqual({
			user: jwtPayload.id,
			role: jwtPayload.role,
			admin: jwtPayload.admin_access,
			app: jwtPayload.app_access,
			share: jwtPayload.share,
			share_scope: jwtPayload.share_scope,
		});
	});

	test('Use passed-in accountability object', async () => {
		const accountability = {} as Accountability;
		const jwtPayload = {} as DirectusTokenPayload;

		vi.mocked(verifyAccessJWT).mockReturnValue(jwtPayload);

		const result = await getAccountabilityForToken(token, accountability);

		expect(result).toBe(accountability);
	});

	test('Cast token with numeric access properties', async () => {
		const jwtPayload = { admin_access: 1, app_access: 0 } as DirectusTokenPayload;

		vi.mocked(verifyAccessJWT).mockReturnValue(jwtPayload);

		const result = await getAccountabilityForToken(token);

		expect(result).toMatchObject({ admin: true, app: false });
	});

	test('Cast token with stringified numeric access properties', async () => {
		const jwtPayload = { admin_access: '1', app_access: '0' } as unknown as DirectusTokenPayload;

		vi.mocked(verifyAccessJWT).mockReturnValue(jwtPayload);

		const result = await getAccountabilityForToken(token);

		expect(result).toMatchObject({ admin: true, app: false });
	});

	test('Verify session JWT', async () => {
		const jwtPayload = {
			session: 'session-token',
		} as DirectusTokenPayload;

		vi.mocked(verifyAccessJWT).mockReturnValue(jwtPayload);

		await getAccountabilityForToken(token);

		expect(verifySessionJWT).toHaveBeenCalledWith(jwtPayload);
	});
});

describe('Static Token', () => {
	const token = 'static-token';

	let tracker: Tracker;

	beforeEach(() => {
		vi.mocked(isDirectusJWT).mockReturnValue(false);

		const db = vi.mocked(knex.default({ client: MockClient }));
		tracker = createTracker(db);

		vi.mocked(getDatabase).mockReturnValue(db);
	});

	afterEach(() => {
		tracker.reset();
	});

	test('Map user from database to accountability', async () => {
		const user = {
			id: 'user-id',
			role: 'role-id',
			admin_access: false,
			app_access: true,
		};

		tracker.on.select('select').response([user]);

		const result = await getAccountabilityForToken(token);

		expect(result).toEqual({
			user: user.id,
			role: user.role,
			admin: user.admin_access,
			app: user.app_access,
		});
	});

	test('Use passed-in accountability object', async () => {
		const user = {};

		tracker.on.select('select').response([user]);

		const accountability = {} as Accountability;

		const result = await getAccountabilityForToken(token, accountability);

		expect(result).toBe(accountability);
	});

	test('Cast numeric access properties', async () => {
		const user = { admin_access: 1, app_access: 0 };

		tracker.on.select('select').response([user]);

		const result = await getAccountabilityForToken(token);

		expect(result).toMatchObject({ admin: true, app: false });
	});

	test('Cast stringified numeric access properties', async () => {
		const user = { admin_access: '1', app_access: '0' };

		tracker.on.select('select').response([user]);

		const result = await getAccountabilityForToken(token);

		expect(result).toMatchObject({ admin: true, app: false });
	});

	test('Throw when user does not exist', async () => {
		tracker.on.select('select').response([]);

		const token = 'invalid-static-token';

		expect(() => getAccountabilityForToken(token)).rejects.toThrow(InvalidCredentialsError);
	});
});
