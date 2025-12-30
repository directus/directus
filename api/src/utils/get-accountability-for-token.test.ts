import { getAccountabilityForToken } from './get-accountability-for-token.js';
import getDatabase from '../database/index.js';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { fetchGlobalAccess } from '../permissions/modules/fetch-global-access/fetch-global-access.js';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, test, vi } from 'vitest';

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
});
