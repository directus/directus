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
vi.mock('../../env.js', () => ({
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
	}),
}));

let controller: WebSocketController;
let mockClient: WebSocketClient;

beforeEach(() => {
	vi.useFakeTimers();
	controller = getWebSocketController()!;

	mockClient = {
		on: vi.fn(),
		off: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
	} as unknown as WebSocketClient;
});

afterEach(() => {
	vi.clearAllMocks();
	vi.useRealTimers();
});

describe('WebSocket heartbeat handler', () => {
	test('client should ping', async () => {
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

	test('connection should be closed', async () => {
		// initialize handler
		new HeartbeatHandler(controller);

		controller.clients.add(mockClient);
		emitter.emitAction('websocket.connect', {}, {} as EventContext);
		vi.advanceTimersByTime(2 * 1000); // 2x 1sec heartbeat interval
		expect(mockClient.send).toBeCalled();
		// the connection should have been closed
		expect(mockClient.close).toBeCalled();
	});

	test('the server should pong if the client pings', async () => {
		// initialize handler
		new HeartbeatHandler(controller);

		controller.clients.add(mockClient);
		emitter.emitAction('websocket.connect', {}, {} as EventContext);
		emitter.emitAction('websocket.message', { client: mockClient, message: { type: 'ping' } }, {} as EventContext);
		expect(mockClient.send).toBeCalled();
	});
});
