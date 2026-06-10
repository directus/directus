import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import getDatabase from '../database/index.js';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { fetchGlobalAccess } from '../permissions/modules/fetch-global-access/fetch-global-access.js';
import { getAccountabilityForToken } from './get-accountability-for-token.js';
import { verifySessionJWT } from './verify-session-jwt.js';

vi.mock('./verify-session-jwt.js');

vi.mock('@directus/env', () => {
	return {
		useEnv: vi.fn().mockReturnValue({ SECRET: 'super-secure-secret', EXTENSIONS_PATH: './extensions' }),
	};
});

vi.mock('../permissions/modules/fetch-global-access/fetch-global-access.js');
vi.mock('../permissions/lib/fetch-roles-tree.js');

vi.mock('../database/index', () => {
	const self: Record<string, any> = {
		select: vi.fn(() => self),
		from: vi.fn(() => self),
		leftJoin: vi.fn(() => self),
		where: vi.fn(() => self),
		first: vi.fn(),
	};

	return { default: vi.fn(() => self) };
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getAccountabilityForToken', async () => {
	test('minimal token payload', async () => {
		const db = getDatabase();

		vi.mocked(fetchRolesTree).mockResolvedValue([]);
		vi.mocked(fetchGlobalAccess).mockResolvedValue({ app: false, admin: false });

		const token = jwt.sign({ role: '123-456-789', app_access: false, admin_access: false }, 'super-secure-secret', {
			issuer: 'directus',
		});

		const expectedAccountability = { admin: false, app: false, role: '123-456-789', roles: [], ip: null, user: null };

		const result = await getAccountabilityForToken(token);
		expect(result).toStrictEqual(expectedAccountability);
		expect(fetchRolesTree).toHaveBeenCalledWith('123-456-789', { knex: db });
		expect(fetchGlobalAccess).toHaveBeenCalledWith(expectedAccountability, { knex: db });
	});

	test('full token payload', async () => {
		const token = jwt.sign(
			{
				share: 'share-id',
				id: 'user-id',
				role: 'role-id',
				admin_access: 1,
				app_access: 1,
			},
			'super-secure-secret',
			{ issuer: 'directus' },
		);

		vi.mocked(fetchRolesTree).mockResolvedValue([]);
		vi.mocked(fetchGlobalAccess).mockResolvedValue({ app: true, admin: true });

		const result = await getAccountabilityForToken(token);

		expect(result).toStrictEqual({
			admin: true,
			app: true,
			user: 'user-id',
			role: 'role-id',
			roles: [],
			ip: null,
			share: 'share-id',
		});
	});

	test('throws token expired error', async () => {
		const token = jwt.sign({ role: '123-456-789' }, 'super-secure-secret', { issuer: 'directus', expiresIn: -1 });
		await expect(() => getAccountabilityForToken(token)).rejects.toThrow('Token expired.');
	});

	test('throws token invalid error', async () => {
		const token = jwt.sign({ role: '123-456-789' }, 'bad-secret', { issuer: 'directus' });
		await expect(() => getAccountabilityForToken(token)).rejects.toThrow('Invalid token.');
	});

	test('find user in database', async () => {
		const db = getDatabase();

		vi.spyOn(db, 'first').mockReturnValue({
			id: 'user-id',
			role: 'role-id',
		} as any);

		vi.mocked(fetchRolesTree).mockResolvedValue([]);
		vi.mocked(fetchGlobalAccess).mockResolvedValue({ app: true, admin: false });

		const token = jwt.sign({ role: '123-456-789' }, 'bad-secret');

		const expectedAccountability = {
			user: 'user-id',
			role: 'role-id',
			roles: [],
			admin: false,
			app: true,
			ip: null,
		};

		const result = await getAccountabilityForToken(token);

		expect(result).toStrictEqual(expectedAccountability);

		expect(fetchRolesTree).toHaveBeenCalledWith('role-id', { knex: db });
		expect(fetchGlobalAccess).toHaveBeenCalledWith(expectedAccountability, { knex: db });
	});

	test('no user found', async () => {
		const db = getDatabase();
		vi.spyOn(db, 'first').mockReturnValue(false as any);
		const token = jwt.sign({ role: '123-456-789' }, 'bad-secret');
		await expect(() => getAccountabilityForToken(token)).rejects.toThrow('Invalid user credentials.');
	});

	describe('oauth in accountability', () => {
		beforeEach(() => {
			vi.mocked(fetchRolesTree).mockResolvedValue([]);
			vi.mocked(fetchGlobalAccess).mockResolvedValue({ app: false, admin: false });
		});

		test('is undefined for regular session JWTs', async () => {
			vi.mocked(verifySessionJWT).mockResolvedValue({ oauth_client: null });

			const token = jwt.sign(
				{ id: 'user-id', role: 'role-id', app_access: false, admin_access: false, session: 'session-token' },
				'super-secure-secret',
				{ issuer: 'directus' },
			);

			const result = await getAccountabilityForToken(token);
			expect(result.oauth).toBeUndefined();
		});

		test('is populated for OAuth session JWTs', async () => {
			vi.mocked(verifySessionJWT).mockResolvedValue({ oauth_client: 'oauth-client-uuid' });

			const token = jwt.sign(
				{
					id: 'user-id',
					role: 'role-id',
					app_access: false,
					admin_access: false,
					session: 'session-token',
					scope: 'mcp:access',
					aud: 'https://example.com/mcp',
				},
				'super-secure-secret',
				{ issuer: 'directus' },
			);

			const result = await getAccountabilityForToken(token);

			expect(result.oauth).toEqual({
				client: 'oauth-client-uuid',
				scopes: ['mcp:access'],
				aud: ['https://example.com/mcp'],
			});
		});

		test('defaults to empty scopes/aud when JWT claims are missing', async () => {
			vi.mocked(verifySessionJWT).mockResolvedValue({ oauth_client: 'client-id' });

			const token = jwt.sign(
				{ id: 'user-id', role: 'role-id', app_access: false, admin_access: false, session: 'session-token' },
				'super-secure-secret',
				{ issuer: 'directus' },
			);

			const result = await getAccountabilityForToken(token);

			expect(result.oauth).toEqual({
				client: 'client-id',
				scopes: [],
				aud: [],
			});
		});

		test('parses space-separated scopes (forward compat, currently only mcp:access)', async () => {
			vi.mocked(verifySessionJWT).mockResolvedValue({ oauth_client: 'client-id' });

			const token = jwt.sign(
				{
					id: 'user-id',
					role: 'role-id',
					app_access: false,
					admin_access: false,
					session: 'session-token',
					scope: 'mcp:access read write',
					aud: 'https://example.com/mcp',
				},
				'super-secure-secret',
				{ issuer: 'directus' },
			);

			const result = await getAccountabilityForToken(token);
			expect(result.oauth?.scopes).toEqual(['mcp:access', 'read', 'write']);
		});

		test('normalizes aud array (forward compat, currently always single value)', async () => {
			vi.mocked(verifySessionJWT).mockResolvedValue({ oauth_client: 'client-id' });

			const token = jwt.sign(
				{
					id: 'user-id',
					role: 'role-id',
					app_access: false,
					admin_access: false,
					session: 'session-token',
					scope: 'mcp:access',
					aud: ['https://a.com/mcp', 'https://b.com/mcp'],
				},
				'super-secure-secret',
				{ issuer: 'directus' },
			);

			const result = await getAccountabilityForToken(token);
			expect(result.oauth?.aud).toEqual(['https://a.com/mcp', 'https://b.com/mcp']);
		});

		test('is undefined for static tokens', async () => {
			const db = getDatabase();

			vi.spyOn(db, 'first').mockReturnValue({
				id: 'user-id',
				role: 'role-id',
			} as any);

			const token = jwt.sign({ role: '123-456-789' }, 'bad-secret');

			const result = await getAccountabilityForToken(token);
			expect(result.oauth).toBeUndefined();
		});

		test('is undefined for null token', async () => {
			const result = await getAccountabilityForToken(null);
			expect(result.oauth).toBeUndefined();
		});
	});
});
