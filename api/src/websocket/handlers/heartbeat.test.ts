import type { EventContext } from '@directus/types';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import emitter from '../../emitter.js';
import { getWebSocketController, type WebSocketController } from '../controllers/index.js';
import type { WebSocketClient } from '../types.js';
import { HeartbeatHandler } from './heartbeat.js';

vi.mock('../controllers', () => ({
	getWebSocketController: vi.fn(() => ({
		clients: new Set(),
	})),
}));

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO
vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		WEBSOCKETS_ENABLED: true,
		WEBSOCKETS_REST_ENABLED: true,
		WEBSOCKETS_REST_AUTH: 'handshake',
		WEBSOCKETS_REST_AUTH_TIMEOUT: 10,
		WEBSOCKETS_REST_PATH: '/websocket',
		WEBSOCKETS_GRAPHQL_ENABLED: true,
		WEBSOCKETS_GRAPHQL_AUTH: 'handshake',
		WEBSOCKETS_GRAPHQL_AUTH_TIMEOUT: 10,
		WEBSOCKETS_GRAPHQL_PATH: '/graphql',
		WEBSOCKETS_HEARTBEAT_ENABLED: true,
		WEBSOCKETS_HEARTBEAT_PERIOD: 1,
		WEBSOCKETS_LOGS_ENABLED: true,
		WEBSOCKETS_LOGS_AUTH: 'handshake',
		WEBSOCKETS_LOGS_AUTH_TIMEOUT: 10,
		WEBSOCKETS_LOGS_PATH: '/logs',
	}),
}));

let controller: WebSocketController;
let mockClient: WebSocketClient;

function createMockClient() {
	return {
		on: vi.fn(),
		off: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
	} as unknown as WebSocketClient;
}

beforeEach(() => {
	vi.useFakeTimers();
	controller = getWebSocketController()!;

	mockClient = createMockClient();
});

afterEach(() => {
	vi.useRealTimers();
	emitter.offAll();
	vi.clearAllMocks();
});

describe('WebSocket heartbeat handler', () => {
	test('should not close a client that responds to pings', async () => {
		// initialize handler
		new HeartbeatHandler(controller);

		(mockClient.send as Mock).mockImplementation(() => {
			//respond with a message
			emitter.emitAction('websocket.message', { client: mockClient, message: { type: 'pong' } }, {} as EventContext);
		});

		controller.clients.add(mockClient);
		emitter.emitAction('websocket.connect', {}, {} as EventContext);
		// wait for ping
		vi.advanceTimersByTime(1000); // 1sec heartbeat interval
		expect(mockClient.send).toBeCalled();
		// wait for another timeout
		vi.advanceTimersByTime(1000); // 1sec heartbeat interval
		expect(mockClient.send).toBeCalled();
		// the connection should not have been closed
		expect(mockClient.close).not.toBeCalled();
	});

	test('should close a client that does not respond to pings', async () => {
		// initialize handler
		new HeartbeatHandler(controller);

		controller.clients.add(mockClient);
		emitter.emitAction('websocket.connect', {}, {} as EventContext);
		vi.advanceTimersByTime(2 * 1000); // 2x 1sec heartbeat interval
		expect(mockClient.send).toBeCalled();
		// the connection should have been closed
		expect(mockClient.close).toBeCalled();
	});

	test('should unsubscribe the message watcher and close only the unresponsive client', async () => {
		const handler = new HeartbeatHandler(controller);

		const listenersBefore = emitter.countActionListeners('websocket.message');
		const responsive = createMockClient();

		// replying more than once per ping must not drag any other client out of the pending set
		(responsive.send as Mock).mockImplementation(() => {
			for (const type of ['pong', 'pong', 'ping']) {
				emitter.emitAction('websocket.message', { client: responsive, message: { type } }, {} as EventContext);
			}
		});

		controller.clients.add(responsive);
		controller.clients.add(mockClient);
		handler.pingClients();

		// mockClient stays idle, so the watcher is still waiting on it
		expect(emitter.countActionListeners('websocket.message')).toBe(listenersBefore + 1);

		vi.advanceTimersByTime(1000);

		expect(responsive.close).not.toBeCalled();
		expect(mockClient.close).toBeCalled();
		expect(emitter.countActionListeners('websocket.message')).toBe(listenersBefore);
	});

	test('should not accumulate message watchers over repeated pings', async () => {
		new HeartbeatHandler(controller);

		const listenersBefore = emitter.countActionListeners('websocket.message');

		controller.clients.add(mockClient);
		emitter.emitAction('websocket.connect', {}, {} as EventContext);

		// the client stays idle, so every ping times out
		vi.advanceTimersByTime(20 * 1000);

		// only the ping that is currently in flight may hold a watcher
		expect(emitter.countActionListeners('websocket.message')).toBeLessThanOrEqual(listenersBefore + 1);
	});

	test('should not subscribe a message watcher when there are no clients to ping', async () => {
		const handler = new HeartbeatHandler(controller);

		const listenersBefore = emitter.countActionListeners('websocket.message');

		handler.pingClients();

		expect(emitter.countActionListeners('websocket.message')).toBe(listenersBefore);
	});

	test('should send a pong when the client pings', async () => {
		// initialize handler
		new HeartbeatHandler(controller);

		controller.clients.add(mockClient);
		emitter.emitAction('websocket.connect', {}, {} as EventContext);
		emitter.emitAction('websocket.message', { client: mockClient, message: { type: 'ping' } }, {} as EventContext);
		expect(mockClient.send).toBeCalled();
	});
});
