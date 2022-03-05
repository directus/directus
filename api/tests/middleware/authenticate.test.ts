// @ts-nocheck

import jwt from 'jsonwebtoken';
import getDatabase from '../../src/database';
import emitter from '../../src/emitter';
import env from '../../src/env';
import { InvalidCredentialsException } from '../../src/exceptions';
import { handler } from '../../src/middleware/authenticate';
import '../../src/types/express.d.ts';

jest.mock('../../src/database');
jest.mock('../../src/env', () => ({
	SECRET: 'test',
}));

afterEach(() => {
	jest.resetAllMocks();
});

test('Short-circuits when authenticate filter is used', async () => {
	const req = {
		ip: '127.0.0.1',
		get: jest.fn(),
	};

	const res = {};
	const next = jest.fn();

	const customAccountability = { admin: true };

	jest.spyOn(emitter, 'emitFilter').mockResolvedValue(customAccountability);

	await handler(req, res, next);

	expect(req.accountability).toEqual(customAccountability);
	expect(next).toHaveBeenCalledTimes(1);
});

test('Uses default public accountability when no token is given', async () => {
	const req = {
		ip: '127.0.0.1',
		get: jest.fn((string) => (string === 'user-agent' ? 'fake-user-agent' : null)),
	};

	const res = {};
	const next = jest.fn();

	jest.spyOn(emitter, 'emitFilter').mockImplementation((_, payload) => payload);

	await handler(req, res, next);

	expect(req.accountability).toEqual({
		user: null,
		role: null,
		admin: false,
		app: false,
		ip: '127.0.0.1',
		userAgent: 'fake-user-agent',
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
		get: jest.fn((string) => (string === 'user-agent' ? 'fake-user-agent' : null)),
		token,
	};

	const res = {};
	const next = jest.fn();

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
	});

	expect(next).toHaveBeenCalledTimes(1);
});

test('Throws InvalidCredentialsException when static token is used, but user does not exist', async () => {
	jest.mocked(getDatabase).mockReturnValue({
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		leftJoin: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		first: jest.fn().mockResolvedValue(undefined),
	});

	const req = {
		ip: '127.0.0.1',
		get: jest.fn((string) => (string === 'user-agent' ? 'fake-user-agent' : null)),
		token: 'static-token',
	};

	const res = {};
	const next = jest.fn();

	expect(handler(req, res, next)).rejects.toEqual(new InvalidCredentialsException());
	expect(next).toHaveBeenCalledTimes(0);
});

test('Sets accountability to user information when static token is used', async () => {
	const req = {
		ip: '127.0.0.1',
		get: jest.fn((string) => (string === 'user-agent' ? 'fake-user-agent' : null)),
		token: 'static-token',
	};

	const res = {};
	const next = jest.fn();

	const testUser = { id: 'test-id', role: 'test-role', admin_access: true, app_access: false };

	const expectedAccountability = {
		user: testUser.id,
		role: testUser.role,
		app: testUser.app_access,
		admin: testUser.admin_access,
		ip: '127.0.0.1',
		userAgent: 'fake-user-agent',
	};

	jest.mocked(getDatabase).mockReturnValue({
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		leftJoin: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		first: jest.fn().mockResolvedValue(testUser),
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
