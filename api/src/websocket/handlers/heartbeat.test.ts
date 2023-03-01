import { expect, describe, test, vi, Mock, beforeEach, afterEach } from 'vitest';
import { getWebsocketController, WebsocketController } from '../controllers';
import emitter from '../../emitter';
import { WebSocketClient } from '../types';
import { HeartbeatHandler } from './heartbeat';

// mocking
vi.mock('../controllers', () => ({
	getWebsocketController: vi.fn(() => ({
		clients: new Set(),
	})),
}));
vi.mock('../../env', async () => {
	const actual = (await vi.importActual('../../env')) as { default: Record<string, any> };
	const MOCK_ENV = {
		...actual.default,
		WEBSOCKETS_HEARTBEAT_FREQUENCY: 1,
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
function delay(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => resolve(), ms);
	});
}

describe('Websocket heartbeat handler', () => {
	let controller: WebsocketController;
	beforeEach(() => {
		controller = getWebsocketController();
	});
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('client should ping', async () => {
		// initialize handler
		new HeartbeatHandler(controller);
		// connect fake client
		const fakeClient = mockClient();
		(fakeClient.send as Mock).mockImplementation(() => {
			//respond with a message
			emitter.emitAction('websocket.message', { client: fakeClient });
		});
		controller.clients.add(fakeClient);
		emitter.emitAction('websocket.connect', {});
		// wait for ping
		await delay(1010); // 1sec interval + 10ms
		expect(fakeClient.send).toBeCalled();
		// wait for another timeout
		await delay(1010); // 1sec interval + 10ms
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
		emitter.emitAction('websocket.connect', {});
		await delay(2010); // 2x 1sec interval + 10ms
		expect(fakeClient.send).toBeCalled();
		// the connection should have been closed
		expect(fakeClient.close).toBeCalled();
	});
});
