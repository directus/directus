import { Accountability } from '@directus/shared/types';
import { expect, describe, test, vi, Mock } from 'vitest';
import { InvalidCredentialsException } from '../index';
import { getAccountabilityForRole } from '../utils/get-accountability-for-role';
import { getAccountabilityForToken } from '../utils/get-accountability-for-token';
import {
	authenticateConnection,
	authenticateWithToken,
	authenticationSuccess,
	refreshAccountability,
} from './authenticate';
import { WebSocketAuthMessage } from './messages';
import { getExpiresAtForToken } from './utils/get-expires-at-for-token';

vi.mock('../utils/get-accountability-for-token', () => ({
	getAccountabilityForToken: vi.fn(),
}));
vi.mock('../utils/get-accountability-for-role', () => ({
	getAccountabilityForRole: vi.fn(),
}));
vi.mock('./utils/get-expires-at-for-token', () => ({
	getExpiresAtForToken: vi.fn(),
}));
vi.mock('../utils/get-schema');
vi.mock('../services/authentication', () => ({
	AuthenticationService: vi.fn(() => ({
		login: vi.fn().mockReturnValue({ accessToken: '123', expires: 123456 }),
		refresh: vi.fn().mockReturnValue({ accessToken: '456' }),
	})),
}));
vi.mock('../database');

describe('authenticateWithToken', () => {
	test('Provided expiry', async () => {
		const TIMESTAMP = 987654321;
		(getAccountabilityForToken as Mock).mockReturnValue({
			role: null, // minimum viable accountability
		} as Accountability);
		(getExpiresAtForToken as Mock).mockReturnValue(123456789);

		const result = await authenticateWithToken('token', TIMESTAMP);

		expect(getAccountabilityForToken).toBeCalled();
		expect(getExpiresAtForToken).not.toBeCalled();
		expect(result).toStrictEqual({
			accountability: { role: null },
			expiresAt: TIMESTAMP,
		});
	});
	test('Fetch expiry', async () => {
		const TIMESTAMP = 123456789;
		(getAccountabilityForToken as Mock).mockReturnValue({
			role: null, // minimum viable accountability
		} as Accountability);
		(getExpiresAtForToken as Mock).mockReturnValue(TIMESTAMP);

		const result = await authenticateWithToken('token');

		expect(getAccountabilityForToken).toBeCalled();
		expect(getExpiresAtForToken).toBeCalled();
		expect(result).toStrictEqual({
			accountability: { role: null },
			expiresAt: TIMESTAMP,
		});
	});
});

describe('authenticateConnection', () => {
	test('Success with email/password', async () => {
		const result = await authenticateConnection({
			type: 'AUTH',
			email: 'email',
			password: 'password',
		} as WebSocketAuthMessage);
		expect(result).toStrictEqual({
			accountability: { role: null },
			expiresAt: 123456,
		});
	});
	test('Success with refresh_token', async () => {
		const TIMESTAMP = 987654;
		(getExpiresAtForToken as Mock).mockReturnValue(TIMESTAMP);

		const result = await authenticateConnection({
			type: 'AUTH',
			refresh_token: 'refresh_token',
		} as WebSocketAuthMessage);

		expect(result).toStrictEqual({
			accountability: { role: null },
			expiresAt: TIMESTAMP,
		});
	});
	test('Success with access_token', async () => {
		const TIMESTAMP = 456987;
		(getExpiresAtForToken as Mock).mockReturnValue(TIMESTAMP);

		const result = await authenticateConnection({
			type: 'AUTH',
			access_token: 'access_token',
		} as WebSocketAuthMessage);

		expect(result).toStrictEqual({
			accountability: { role: null },
			expiresAt: TIMESTAMP,
		});
	});
	test('Failure token expired', async () => {
		(getAccountabilityForToken as Mock).mockImplementation(() => {
			throw new InvalidCredentialsException('Token expired.');
		});
		expect(() =>
			authenticateConnection({
				type: 'AUTH',
				access_token: 'expired',
			} as WebSocketAuthMessage)
		).rejects.toThrow('Token expired.');
	});
	test('Failure authentication failed', async () => {
		(getAccountabilityForToken as Mock).mockReturnValue({
			role: null, // minimum viable accountability
		} as Accountability);
		expect(() =>
			authenticateConnection({
				type: 'AUTH',
				access_token: '',
			} as WebSocketAuthMessage)
		).rejects.toThrow('Authentication failed.');
	});
});

describe('refreshAccountability', () => {
	test('should just work', async () => {
		(getAccountabilityForRole as Mock).mockReturnValue({
			role: '123-456-789',
		} as Accountability);

		const result = await refreshAccountability({
			role: null,
			user: 'abc-def-ghi',
		});

		expect(result).toStrictEqual({
			role: '123-456-789',
			user: 'abc-def-ghi',
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
