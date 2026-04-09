import { InvalidCredentialsError } from '@directus/errors';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import getDatabase from '../database/index.js';
import { verifySessionJWT } from './verify-session-jwt.js';

vi.mock('../database/index', () => {
	const self: Record<string, any> = {
		select: vi.fn(() => self),
		from: vi.fn(() => self),
		where: vi.fn(() => self),
		andWhere: vi.fn(() => self),
		first: vi.fn(),
	};

	return { default: vi.fn(() => self) };
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe('verifySessionJWT', () => {
	test('returns { oauth_client: null } for regular sessions', async () => {
		const db = getDatabase();
		vi.spyOn(db, 'first').mockResolvedValue({ oauth_client: null });

		const payload = {
			id: 'user-id',
			role: 'role-id',
			app_access: false as boolean | number,
			admin_access: false as boolean | number,
			session: 'session-token',
		};

		const result = await verifySessionJWT(payload);
		expect(result).toStrictEqual({ oauth_client: null });
	});

	test('returns { oauth_client: "<uuid>" } for OAuth sessions', async () => {
		const db = getDatabase();
		const oauthClientId = 'abc-123-uuid';
		vi.spyOn(db, 'first').mockResolvedValue({ oauth_client: oauthClientId });

		const payload = {
			id: 'user-id',
			role: 'role-id',
			app_access: false as boolean | number,
			admin_access: false as boolean | number,
			session: 'session-token',
		};

		const result = await verifySessionJWT(payload);
		expect(result).toStrictEqual({ oauth_client: oauthClientId });
	});

	test('still throws on missing session', async () => {
		const db = getDatabase();
		vi.spyOn(db, 'first').mockResolvedValue(undefined);

		const payload = {
			id: 'user-id',
			role: 'role-id',
			app_access: false as boolean | number,
			admin_access: false as boolean | number,
			session: 'session-token',
		};

		await expect(() => verifySessionJWT(payload)).rejects.toThrow(InvalidCredentialsError);
	});

	test('selects oauth_client column', async () => {
		const db = getDatabase();
		vi.spyOn(db, 'first').mockResolvedValue({ oauth_client: null });

		const payload = {
			id: 'user-id',
			role: 'role-id',
			app_access: false as boolean | number,
			admin_access: false as boolean | number,
			session: 'session-token',
		};

		await verifySessionJWT(payload);
		expect(db.select).toHaveBeenCalledWith('oauth_client');
	});
});
