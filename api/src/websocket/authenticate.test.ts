import type { Accountability } from '@directus/types';
import type { Mock } from 'vitest';
import { describe, expect, test, vi } from 'vitest';
import { InvalidCredentialsError } from '@directus/errors';
import { getAccountabilityForToken } from '../utils/get-accountability-for-token.js';
import { getPermissions } from '../utils/get-permissions.js';
import { authenticateConnection, authenticationSuccess, refreshAccountability } from './authenticate.js';
import type { WebSocketAuthMessage } from './messages.js';
import { getExpiresAtForToken } from './utils/get-expires-at-for-token.js';

vi.mock('../utils/get-accountability-for-token', () => ({
	getAccountabilityForToken: vi.fn().mockReturnValue({
		role: null, // minimum viable accountability
	} as Accountability),
}));

vi.mock('../utils/get-permissions', () => ({
	getPermissions: vi.fn(),
}));

vi.mock('./utils/get-expires-at-for-token', () => ({
	getExpiresAtForToken: vi.fn(),
}));

vi.mock('../utils/get-schema');

vi.mock('../services/authentication', () => ({
	AuthenticationService: vi.fn(() => ({
		login: vi.fn().mockReturnValue({ accessToken: '123', refreshToken: 'refresh', expires: 123456 }),
		refresh: vi.fn().mockReturnValue({ accessToken: '456', refreshToken: 'refresh' }),
	})),
}));

vi.mock('../database');

describe('authenticateConnection', () => {
	test('Success with email/password', async () => {
		const TIMESTAMP = 123456789;
		(getExpiresAtForToken as Mock).mockReturnValue(TIMESTAMP);

		const result = await authenticateConnection({
			type: 'auth',
			email: 'email',
			password: 'password',
		} as WebSocketAuthMessage);

		expect(result).toStrictEqual({
			accountability: { role: null },
			expires_at: TIMESTAMP,
			refresh_token: 'refresh',
		});
	});

	test('Success with refresh_token', async () => {
		const TIMESTAMP = 987654;
		(getExpiresAtForToken as Mock).mockReturnValue(TIMESTAMP);

		const result = await authenticateConnection({
			type: 'auth',
			refresh_token: 'refresh_token',
		} as WebSocketAuthMessage);

		expect(result).toStrictEqual({
			accountability: { role: null },
			expires_at: TIMESTAMP,
			refresh_token: 'refresh',
		});
	});

	test('Success with access_token', async () => {
		const TIMESTAMP = 456987;
		(getExpiresAtForToken as Mock).mockReturnValue(TIMESTAMP);

		const result = await authenticateConnection({
			type: 'auth',
			access_token: 'access_token',
		} as WebSocketAuthMessage);

		expect(result).toStrictEqual({
			accountability: { role: null },
			expires_at: TIMESTAMP,
			refresh_token: undefined,
		});
	});

	test('Failure token expired', async () => {
		(getAccountabilityForToken as Mock).mockImplementation(() => {
			throw new InvalidCredentialsError();
		});

		expect(() =>
			authenticateConnection({
				type: 'auth',
				access_token: 'expired',
			} as WebSocketAuthMessage)
		).rejects.toThrow('Authentication failed.');
	});

	test('Failure authentication failed', async () => {
		expect(() =>
			authenticateConnection({
				type: 'auth',
				access_token: '',
			} as WebSocketAuthMessage)
		).rejects.toThrow('Authentication failed.');
	});
});

describe('refreshAccountability', () => {
	test('update permissions', async () => {
		(getPermissions as Mock).mockReturnValue([]);

		const result = await refreshAccountability({
			role: '123-456-789',
			user: 'abc-def-ghi',
		});

		expect(result).toStrictEqual({
			role: '123-456-789',
			user: 'abc-def-ghi',
			permissions: [],
		});
	});
});

describe('authenticationSuccess', () => {
	test('without uid', async () => {
		const result = authenticationSuccess();
		expect(result).toBe('{"type":"auth","status":"ok"}');
	});

	test('with uid', async () => {
		const result = authenticationSuccess('123456');
		expect(result).toBe('{"type":"auth","status":"ok","uid":"123456"}');
	});
});
