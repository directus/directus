import { Accountability } from '@directus/shared/types';
import { expect, describe, test, vi } from 'vitest';
import { InvalidCredentialsException } from '../index';
import {
	authenticateConnection,
	authenticateWithToken,
	authenticationSuccess,
	refreshAccountability,
} from './authenticate';
import { WebSocketAuthMessage } from './messages';

vi.mock('../utils/get-accountability-for-token');
vi.mock('../utils/get-accountability-for-role');
vi.mock('./utils/get-expires-at-for-token');
vi.mock('../utils/get-schema');
vi.mock('../services/authentication');
vi.mock('../database');

describe('authenticateWithToken', async () => {
	const AFT = await import('../utils/get-accountability-for-token.js');
	AFT.getAccountabilityForToken = vi.fn().mockReturnValue({
		role: null, // minimum viable accountability
	} as Accountability);
	const EFT = await import('./utils/get-expires-at-for-token.js');
	test('Provided expiry', async () => {
		const TIMESTAMP = 987654321;
		EFT.getExpiresAtForToken = vi.fn().mockReturnValue(123456789);
		const result = await authenticateWithToken('token', TIMESTAMP);
		expect(AFT.getAccountabilityForToken).toBeCalled();
		expect(EFT.getExpiresAtForToken).not.toBeCalled();
		expect(result).toStrictEqual({
			accountability: { role: null },
			expiresAt: TIMESTAMP,
		});
	});
	test('Fetch expiry', async () => {
		const TIMESTAMP = 123456789;
		const AFT = await import('../utils/get-accountability-for-token.js');
		const EFT = await import('./utils/get-expires-at-for-token.js');
		EFT.getExpiresAtForToken = vi.fn().mockReturnValue(TIMESTAMP);
		const result = await authenticateWithToken('token');
		expect(AFT.getAccountabilityForToken).toBeCalled();
		expect(EFT.getExpiresAtForToken).toBeCalled();
		expect(result).toStrictEqual({
			accountability: { role: null },
			expiresAt: TIMESTAMP,
		});
	});
});

describe('authenticateConnection', async () => {
	const services = await import('../services/authentication.js');
	const EFT = await import('./utils/get-expires-at-for-token.js');
	// @ts-ignore
	services.AuthenticationService = vi.fn(() => ({
		login: vi.fn().mockReturnValue({ accessToken: '123', expires: 123456 }),
		refresh: vi.fn().mockReturnValue({ accessToken: '456' }),
	}));
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
		EFT.getExpiresAtForToken = vi.fn().mockReturnValue(TIMESTAMP);
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
		EFT.getExpiresAtForToken = vi.fn().mockReturnValue(TIMESTAMP);
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
		const AFT = await import('../utils/get-accountability-for-token.js');
		AFT.getAccountabilityForToken = vi.fn().mockImplementation(() => {
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
		const AFT = await import('../utils/get-accountability-for-role.js');
		AFT.getAccountabilityForRole = vi.fn().mockReturnValue({
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
