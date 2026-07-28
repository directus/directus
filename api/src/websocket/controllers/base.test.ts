import type { Server as httpServer } from 'http';
import { useEnv } from '@directus/env';
import type { Accountability } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { authenticateConnection } from '../authenticate.js';
import type { WebSocketAuthMessage } from '../messages.js';
import type { WebSocketClient } from '../types.js';
import SocketController from './base.js';

vi.mock('@directus/env');

vi.mock('../authenticate.js', () => ({
	authenticateConnection: vi.fn(),
	authenticationSuccess: vi.fn(() => 'auth-success'),
}));

vi.mock('../../emitter.js', () => ({
	default: {
		emitAction: vi.fn(),
		emitFilter: vi.fn(),
		onAction: vi.fn(),
	},
}));

vi.mock('../../license/manager.js', () => ({
	getLicenseManager: vi.fn(() => ({ isLocked: vi.fn().mockResolvedValue(false) })),
}));

vi.mock('../../logger/index.js', () => ({
	useLogger: vi.fn(() => ({
		debug: vi.fn(),
		trace: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	})),
}));

vi.mock('../../rate-limiter.js', () => ({
	createRateLimiter: vi.fn(),
}));

// Concrete implementation so the abstract controller can be instantiated
class TestController extends SocketController {}

function mockHttpServer() {
	return { on: vi.fn() } as unknown as httpServer;
}

function mockClient(accountability: Accountability | null): WebSocketClient {
	return {
		accountability,
		expires_at: null,
		uid: 'test-uid',
		auth_timer: null,
		send: vi.fn(),
		close: vi.fn(),
		on: vi.fn(),
		off: vi.fn(),
	} as unknown as WebSocketClient;
}

const PUBLIC_ACCOUNTABILITY: Accountability = {
	role: null,
	user: null,
	roles: [],
	admin: false,
	app: false,
	ip: '127.0.0.1',
};

function setupController(mode: 'public' | 'strict' | 'handshake') {
	(useEnv as ReturnType<typeof vi.fn>).mockReturnValue({
		WEBSOCKETS_REST_PATH: '/websocket',
		WEBSOCKETS_REST_AUTH: mode,
		WEBSOCKETS_REST_AUTH_TIMEOUT: 10,
		RATE_LIMITER_ENABLED: false,
	});

	return new TestController(mockHttpServer(), 'WEBSOCKETS_REST');
}

describe('WebSocket SocketController auth failure handling', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	test('public mode preserves public-role accountability after a failed auth attempt', async () => {
		const controller = setupController('public');
		const client = mockClient(PUBLIC_ACCOUNTABILITY);

		(authenticateConnection as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('invalid token'));

		await controller['handleAuthRequest'](client, {
			type: 'auth',
			access_token: 'definitely-invalid',
			uid: 'force-null-auth',
		} as WebSocketAuthMessage);

		// The socket must NOT fall back to null accountability (which bypasses permission checks)
		expect(client.accountability).not.toBeNull();

		expect(client.accountability).toMatchObject({
			role: null,
			user: null,
			admin: false,
			app: false,
			// connection metadata is carried over from the original public accountability
			ip: '127.0.0.1',
		});

		expect(client.expires_at).toBeNull();
		// public mode keeps the socket open
		expect(client.close).not.toHaveBeenCalled();
	});

	test('strict mode falls back to a non-null public accountability and closes the socket after a failed auth attempt', async () => {
		const controller = setupController('strict');
		const client = mockClient(PUBLIC_ACCOUNTABILITY);

		(authenticateConnection as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('invalid token'));

		await controller['handleAuthRequest'](client, {
			type: 'auth',
			access_token: 'definitely-invalid',
			uid: 'force-null-auth',
		} as WebSocketAuthMessage);

		// Even though the socket is closed, accountability must never become null (which bypasses
		// permission checks) in case any in-flight message is still processed.
		expect(client.accountability).not.toBeNull();
		expect(client.accountability).toMatchObject({ role: null, user: null, admin: false });
		expect(client.expires_at).toBeNull();
		expect(client.close).toHaveBeenCalled();
	});

	test('public mode falls back to public-role accountability when the token expires', async () => {
		const controller = setupController('public');
		const client = mockClient({ ...PUBLIC_ACCOUNTABILITY, user: 'some-user', role: 'some-role' });
		// expires in the past so the timer fires immediately when scheduled
		client.expires_at = Math.floor(Date.now() / 1000) + 1;

		controller.setTokenExpireTimer(client);
		await vi.runOnlyPendingTimersAsync();

		expect(client.accountability).not.toBeNull();
		expect(client.accountability).toMatchObject({ role: null, user: null, admin: false });
		expect(client.expires_at).toBeNull();
	});

	test('strict mode falls back to a non-null public accountability when the token expires', async () => {
		const controller = setupController('strict');
		const client = mockClient({ ...PUBLIC_ACCOUNTABILITY, user: 'some-user', role: 'some-role' });
		client.expires_at = Math.floor(Date.now() / 1000) + 1;

		controller.setTokenExpireTimer(client);
		await vi.runOnlyPendingTimersAsync();

		expect(client.accountability).not.toBeNull();
		expect(client.accountability).toMatchObject({ role: null, user: null, admin: false });
		expect(client.expires_at).toBeNull();
	});
});
