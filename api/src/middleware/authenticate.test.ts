import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { handler } from './authenticate.js';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { fetchGlobalAccess } from '../permissions/modules/fetch-global-access/fetch-global-access.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import { InvalidCredentialsError } from '@directus/errors';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Knex } from 'knex';
import { afterEach, expect, test, vi } from 'vitest';
import '../types/express.d.ts';

const reqGetImplementation = (string: any) => {
	switch (string) {
		case 'user-agent':
			return 'fake-user-agent';
		case 'origin':
			return 'fake-origin';
		default:
			return null;
	}
};

vi.mock('../database/index');

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO
vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		SECRET: 'test',
		EXTENSIONS_PATH: './extensions',
		SESSION_COOKIE_NAME: 'directus_session',
		// needed for constants.ts top level mocking
		REFRESH_TOKEN_COOKIE_DOMAIN: '',
		REFRESH_TOKEN_TTL: 0,
		REFRESH_TOKEN_COOKIE_SECURE: false,
		SESSION_COOKIE_DOMAIN: '',
		SESSION_COOKIE_TTL: 0,
		SESSION_COOKIE_SECURE: false,
		IP_TRUST_PROXY: true,
	}),
}));

vi.mock('../permissions/lib/fetch-roles-tree.js');
vi.mock('../permissions/modules/fetch-global-access/fetch-global-access.js');

afterEach(() => {
	vi.clearAllMocks();
});

test('Short-circuits when authenticate filter is used', async () => {
	const req = {
		socket: { remoteAddress: '127.0.0.1' },
		headers: {},
		cookies: {},
		get: vi.fn(reqGetImplementation),
	} as unknown as Request;

	const res = {} as Response;
	const next = vi.fn();

	const customAccountability = { admin: true };

	vi.spyOn(emitter, 'emitFilter').mockResolvedValue(customAccountability);

	await handler(req, res, next);

	expect(req.accountability).toEqual(customAccountability);
	expect(next).toHaveBeenCalledTimes(1);
});

test('Uses default public accountability when no token is given', async () => {
	const req = {
		socket: { remoteAddress: '127.0.0.1' },
		headers: {},
		cookies: {},
		get: vi.fn(reqGetImplementation),
	} as unknown as Request;

	const res = {} as Response;
	const next = vi.fn();

	vi.spyOn(emitter, 'emitFilter').mockImplementation(async (_, payload) => payload);

	await handler(req, res, next);

	expect(req.accountability).toEqual(
		createDefaultAccountability({
			ip: '127.0.0.1',
			userAgent: 'fake-user-agent',
			origin: 'fake-origin',
		}),
	);

	expect(next).toHaveBeenCalledTimes(1);
});

test('Sets accountability to payload contents if valid token is passed', async () => {
	const userID = '3fac3c02-607f-4438-8d6e-6b8b25109b52';
	const roleID = '38269fc6-6eb6-475a-93cb-479d97f73039';
	const share = 'ca0ad005-f4ad-4bfe-b428-419ee8784790';

	const appAccess = true;
	const adminAccess = false;

	const token = jwt.sign(
		{
			id: userID,
			role: roleID,
			app_access: appAccess,
			admin_access: adminAccess,
			share,
		},
		'test',
		{ issuer: 'directus' },
	);

	const req = {
		socket: { remoteAddress: '127.0.0.1' },
		headers: {},
		cookies: {},
		get: vi.fn(reqGetImplementation),
		token,
	} as unknown as Request;

	const res = {} as Response;
	const next = vi.fn();

	vi.mocked(fetchRolesTree).mockResolvedValue([roleID]);
	vi.mocked(fetchGlobalAccess).mockResolvedValue({ app: appAccess, admin: adminAccess });

	await handler(req, res, next);

	expect(req.accountability).toEqual({
		user: userID,
		role: roleID,
		roles: [roleID],
		app: appAccess,
		admin: adminAccess,
		share,
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
		},
		'test',
		{ issuer: 'directus' },
	);

	await handler(req, res, next);

	expect(req.accountability).toEqual({
		user: userID,
		role: roleID,
		roles: [roleID],
		app: appAccess,
		admin: adminAccess,
		share,
		ip: '127.0.0.1',
		userAgent: 'fake-user-agent',
		origin: 'fake-origin',
	});

	expect(next).toHaveBeenCalledTimes(1);
});

test('Throws InvalidCredentialsError when static token is used, but user does not exist', async () => {
	vi.mocked(getDatabase).mockReturnValue({
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		first: vi.fn().mockResolvedValue(undefined),
	} as unknown as Knex);

	const req = {
		socket: { remoteAddress: '127.0.0.1' },
		headers: {},
		cookies: {},
		get: vi.fn(reqGetImplementation),
		token: 'static-token',
	} as unknown as Request;

	const res = {} as Response;
	const next = vi.fn();

	await expect(handler(req, res, next)).rejects.toEqual(new InvalidCredentialsError());
	expect(next).toHaveBeenCalledTimes(0);
});

test('Sets accountability to user information when static token is used', async () => {
	const req = {
		socket: { remoteAddress: '127.0.0.1' },
		headers: {},
		cookies: {},
		get: vi.fn(reqGetImplementation),
		token: 'static-token',
	} as unknown as Request;

	const res = {} as Response;
	const next = vi.fn();

	const testUser = { id: 'test-id', role: 'test-role', admin_access: true, app_access: false };

	const expectedAccountability = {
		user: testUser.id,
		role: testUser.role,
		roles: [testUser.role],
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
	} as unknown as Knex);

	vi.mocked(fetchRolesTree).mockResolvedValue([testUser.role]);
	vi.mocked(fetchGlobalAccess).mockResolvedValue({ app: testUser.app_access, admin: testUser.admin_access });

	await handler(req, res, next);

	expect(req.accountability).toEqual(expectedAccountability);
	expect(next).toHaveBeenCalledTimes(1);

	// Test for 0 / 1 instead of false / true
	next.mockClear();
	testUser.admin_access = 1 as never;
	testUser.app_access = 0 as never;
	await handler(req, res, next);
	expect(req.accountability).toEqual(expectedAccountability);
	expect(next).toHaveBeenCalledTimes(1);

	// Test for "1" / "0" instead of true / false
	next.mockClear();
	testUser.admin_access = '0' as never;
	testUser.app_access = '1' as never;
	expectedAccountability.admin = false;
	expectedAccountability.app = true;

	vi.mocked(fetchGlobalAccess).mockResolvedValue({ app: true, admin: false });

	await handler(req, res, next);
	expect(req.accountability).toEqual(expectedAccountability);
	expect(next).toHaveBeenCalledTimes(1);
});

test('Invalid session token responds with error and clears the cookie', async () => {
	const req = {
		socket: { remoteAddress: '127.0.0.1' },
		headers: {},
		cookies: {
			directus_session: 'session-token',
		},
		get: vi.fn(reqGetImplementation),
		token: 'session-token',
	} as unknown as Request;

	const res = {
		clearCookie: vi.fn(),
	} as unknown as Response;

	const next = vi.fn();

	vi.mocked(getDatabase).mockReturnValue({
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		first: vi.fn().mockResolvedValue(null),
	} as unknown as Knex);

	await expect(handler(req, res, next)).rejects.toEqual(new InvalidCredentialsError());
	expect(res.clearCookie).toHaveBeenCalledTimes(1);
	expect(next).toHaveBeenCalledTimes(0);
});

test('Invalid query token responds with error but does not clear the session cookie', async () => {
	const req = {
		socket: { remoteAddress: '127.0.0.1' },
		headers: {},
		cookies: {
			directus_session: 'session-token',
		},
		get: vi.fn(reqGetImplementation),
		token: 'static-token',
	} as unknown as Request;

	const res = {
		clearCookie: vi.fn(),
	} as unknown as Response;

	const next = vi.fn();

	vi.mocked(getDatabase).mockReturnValue({
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		first: vi.fn().mockResolvedValue(null),
	} as unknown as Knex);

	await expect(handler(req, res, next)).rejects.toEqual(new InvalidCredentialsError());
	expect(next).toHaveBeenCalledTimes(0);
	expect(res.clearCookie).toHaveBeenCalledTimes(0);
});
