import { expect, describe, test, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import env from '../env.js';
import { getAccountabilityForToken } from './get-accountability-for-token.js';
import getDatabase from '../database/index.js';

vi.mock('../env', () => {
	const MOCK_ENV = {
		SECRET: 'super-secure-secret',
		EXTENSIONS_PATH: './extensions',
	};

	return {
		default: MOCK_ENV,
		getEnv: () => MOCK_ENV,
	};
});

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

describe('getAccountabilityForToken', async () => {
	test('minimal token payload', async () => {
		const token = jwt.sign({ role: '123-456-789', app_access: false, admin_access: false }, env['SECRET'], {
			issuer: 'directus',
		});

		const result = await getAccountabilityForToken(token);
		expect(result).toStrictEqual({ admin: false, app: false, role: '123-456-789', user: null });
	});

	test('full token payload', async () => {
		const token = jwt.sign(
			{
				share: 'share-id',
				share_scope: 'share-scope',
				id: 'user-id',
				role: 'role-id',
				admin_access: 1,
				app_access: 1,
			},
			env['SECRET'],
			{ issuer: 'directus' }
		);

		const result = await getAccountabilityForToken(token);
		expect(result.admin).toBe(true);
		expect(result.app).toBe(true);
		expect(result.role).toBe('role-id');
		expect(result.share).toBe('share-id');
		expect(result.share_scope).toBe('share-scope');
		expect(result.user).toBe('user-id');
	});

	test('throws token expired error', async () => {
		const token = jwt.sign({ role: '123-456-789' }, env['SECRET'], { issuer: 'directus', expiresIn: -1 });
		expect(() => getAccountabilityForToken(token)).rejects.toThrow('Token expired.');
	});

	test('throws token invalid error', async () => {
		const token = jwt.sign({ role: '123-456-789' }, 'bad-secret', { issuer: 'directus' });
		expect(() => getAccountabilityForToken(token)).rejects.toThrow('Invalid token.');
	});

	test('find user in database', async () => {
		const db = getDatabase();

		vi.spyOn(db, 'first').mockReturnValue({
			id: 'user-id',
			role: 'role-id',
			admin_access: false,
			app_access: true,
		} as any);

		const token = jwt.sign({ role: '123-456-789' }, 'bad-secret');
		const result = await getAccountabilityForToken(token);

		expect(result).toStrictEqual({
			user: 'user-id',
			role: 'role-id',
			admin: false,
			app: true,
		});
	});

	test('no user found', async () => {
		const db = getDatabase();
		vi.spyOn(db, 'first').mockReturnValue(false as any);
		const token = jwt.sign({ role: '123-456-789' }, 'bad-secret');
		expect(() => getAccountabilityForToken(token)).rejects.toThrow('Invalid user credentials.');
	});
});
