// @ts-nocheck

import jwt from 'jsonwebtoken';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import env from '../env.js';
import { InvalidCredentialsException } from '../exceptions/index.js';
import { handler } from './authenticate.js';
import '../types/express.d.ts';
import { afterEach, test, expect, vi} from 'vitest'

vi.mock('../database/index.js');
vi.mock('../env.js', () => ({
	default: {
		SECRET: 'test',
	}
}));

afterEach(() => {
	vi.resetAllMocks();
});

test('Short-circuits when authenticate filter is used', async () => {
	const req = {
		ip: '127.0.0.1',
		get: vi.fn(),
	};

	const res = {};
	const next = vi.fn();

	const customAccountability = { admin: true };

	vi.spyOn(emitter, 'emitFilter').mockResolvedValue(customAccountability);

	await handler(req, res, next);

	expect(req.accountability).toEqual(customAccountability);
	expect(next).toHaveBeenCalledTimes(1);
});

test('Uses default public accountability when no token is given', async () => {
	const req = {
		ip: '127.0.0.1',
		get: vi.fn((string) => {
			switch (string) {
				case 'user-agent':
					return 'fake-user-agent';
				case 'origin':
					return 'fake-origin';
				default:
					return null;
			}
		}),
	};

	const res = {};
	const next = vi.fn();

	vi.spyOn(emitter, 'emitFilter').mockImplementation((_, payload) => payload);

	await handler(req, res, next);

	expect(req.accountability).toEqual({
		user: null,
		role: null,
		admin: false,
		app: false,
		ip: '127.0.0.1',
		userAgent: 'fake-user-agent',
		origin: 'fake-origin',
	});

	expect(next).toHaveBeenCalledTimes(1);
});

test('Sets accountability to payload contents if valid token is passed', async () => {
	const userID = '3fac3c02-607f-4438-8d6e-6b8b25109b52';
	const roleID = '38269fc6-6eb6-475a-93cb-479d97f73039';
	const share = 'ca0ad005-f4ad-4bfe-b428-419ee8784790';
	const shareScope = {
		collection: 'articles',
		item: 15,
	};
	const appAccess = true;
	const adminAccess = false;

	const token = jwt.sign(
		{
			id: userID,
			role: roleID,
			app_access: appAccess,
			admin_access: adminAccess,
			share,
			share_scope: shareScope,
		},
		env.SECRET,
		{ issuer: 'directus' }
	);

	const req = {
		ip: '127.0.0.1',
		get: vi.fn((string) => {
			switch (string) {
				case 'user-agent':
					return 'fake-user-agent';
				case 'origin':
					return 'fake-origin';
				default:
					return null;
			}
		}),
		token,
	};

	const res = {};
	const next = vi.fn();

	await handler(req, res, next);

	expect(req.accountability).toEqual({
		user: userID,
		role: roleID,
		app: appAccess,
		admin: adminAccess,
		share,
		share_scope: shareScope,
		ip: '127.0.0.1',
		userAgent: 'fake-user-agent',
		origin: 'fake-origin',
	});

	expect(next).toHaveBeenCalledTimes(1);

	// Test with 1/0 instead or true/false
	next.mockClear();

	req.token = jwt.sign(
		{
			id: userID,
			role: roleID,
			app_access: 1,
			admin_access: 0,
			share,
			share_scope: shareScope,
		},
		env.SECRET,
		{ issuer: 'directus' }
	);

	await handler(req, res, next);

	expect(req.accountability).toEqual({
		user: userID,
		role: roleID,
		app: appAccess,
		admin: adminAccess,
		share,
		share_scope: shareScope,
		ip: '127.0.0.1',
		userAgent: 'fake-user-agent',
		origin: 'fake-origin',
	});

	expect(next).toHaveBeenCalledTimes(1);
});

test('Throws InvalidCredentialsException when static token is used, but user does not exist', async () => {
	vi.mocked(getDatabase).mockReturnValue({
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		first: vi.fn().mockResolvedValue(undefined),
	});

	const req = {
		ip: '127.0.0.1',
		get: vi.fn((string) => {
			switch (string) {
				case 'user-agent':
					return 'fake-user-agent';
				case 'origin':
					return 'fake-origin';
				default:
					return null;
			}
		}),
		token: 'static-token',
	};

	const res = {};
	const next = vi.fn();

	expect(handler(req, res, next)).rejects.toEqual(new InvalidCredentialsException());
	expect(next).toHaveBeenCalledTimes(0);
});

test('Sets accountability to user information when static token is used', async () => {
	const req = {
		ip: '127.0.0.1',
		get: vi.fn((string) => {
			switch (string) {
				case 'user-agent':
					return 'fake-user-agent';
				case 'origin':
					return 'fake-origin';
				default:
					return null;
			}
		}),
		token: 'static-token',
	};

	const res = {};
	const next = vi.fn();

	const testUser = { id: 'test-id', role: 'test-role', admin_access: true, app_access: false };

	const expectedAccountability = {
		user: testUser.id,
		role: testUser.role,
		app: testUser.app_access,
		admin: testUser.admin_access,
		ip: '127.0.0.1',
		userAgent: 'fake-user-agent',
		origin: 'fake-origin',
	};

	vi.mocked(getDatabase).mockReturnValue({
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		first: vi.fn().mockResolvedValue(testUser),
	});

	await handler(req, res, next);

	expect(req.accountability).toEqual(expectedAccountability);
	expect(next).toHaveBeenCalledTimes(1);

	// Test for 0 / 1 instead of false / true
	next.mockClear();
	testUser.admin_access = 1;
	testUser.app_access = 0;
	await handler(req, res, next);
	expect(req.accountability).toEqual(expectedAccountability);
	expect(next).toHaveBeenCalledTimes(1);

	// Test for "1" / "0" instead of true / false
	next.mockClear();
	testUser.admin_access = '0';
	testUser.app_access = '1';
	expectedAccountability.admin = false;
	expectedAccountability.app = true;
	await handler(req, res, next);
	expect(req.accountability).toEqual(expectedAccountability);
	expect(next).toHaveBeenCalledTimes(1);
});
