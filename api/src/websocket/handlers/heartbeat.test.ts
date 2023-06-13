import type { EventContext } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Mock } from 'vitest';
import emitter from '../../emitter.js';
import { WebSocketController, getWebSocketController } from '../controllers/index.js';
import type { WebSocketClient } from '../types.js';
import { HeartbeatHandler } from './heartbeat.js';

// mocking
vi.mock('../controllers', () => ({
	getWebSocketController: vi.fn(() => ({
		clients: new Set(),
	})),
}));

vi.mock('../../env', async () => {
	const actual = (await vi.importActual('../../env')) as { default: Record<string, any> };

	const MOCK_ENV = {
		...actual.default,
		WEBSOCKETS_HEARTBEAT_PERIOD: 1,
	};

	return {
		default: MOCK_ENV,
		getEnv: () => MOCK_ENV,
	};
});

function mockClient() {
	return {
		on: vi.fn(),
		off: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
	} as unknown as WebSocketClient;
}

describe('WebSocket heartbeat handler', () => {
	let controller: WebSocketController;

	beforeEach(() => {
		vi.useFakeTimers();
		controller = getWebSocketController();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	test('client should ping', async () => {
		// initialize handler
		new HeartbeatHandler(controller);
		// connect fake client
		const fakeClient = mockClient();

		(fakeClient.send as Mock).mockImplementation(() => {
			//respond with a message
			emitter.emitAction('websocket.message', { client: fakeClient, message: { type: 'pong' } }, {} as EventContext);
		});

		controller.clients.add(fakeClient);
		emitter.emitAction('websocket.connect', {}, {} as EventContext);
		// wait for ping
		vi.advanceTimersByTime(1000); // 1sec heartbeat interval
		expect(fakeClient.send).toBeCalled();
		// wait for another timeout
		vi.advanceTimersByTime(1000); // 1sec heartbeat interval
		expect(fakeClient.send).toBeCalled();
		// the connection should not have been closed
		expect(fakeClient.close).not.toBeCalled();
	});

	test('connection should be closed', async () => {
		// initialize handler
		new HeartbeatHandler(controller);
		// connect fake client
		const fakeClient = mockClient();
		controller.clients.add(fakeClient);
		emitter.emitAction('websocket.connect', {}, {} as EventContext);
		vi.advanceTimersByTime(2 * 1000); // 2x 1sec heartbeat interval
		expect(fakeClient.send).toBeCalled();
		// the connection should have been closed
		expect(fakeClient.close).toBeCalled();
	});

	test('the server should pong if the client pings', async () => {
		// initialize handler
		new HeartbeatHandler(controller);
		// connect fake client
		const fakeClient = mockClient();
		controller.clients.add(fakeClient);
		emitter.emitAction('websocket.connect', {}, {} as EventContext);
		emitter.emitAction('websocket.message', { client: fakeClient, message: { type: 'ping' } }, {} as EventContext);
		expect(fakeClient.send).toBeCalled();
	});
});
