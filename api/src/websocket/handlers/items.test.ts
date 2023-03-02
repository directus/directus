import { expect, describe, test, vi, Mock, beforeEach, afterEach } from 'vitest';
import { WebSocketClient } from '../types';
import emitter from '../../emitter';
import { ItemsHandler } from './items';
import { getSchema } from '../../utils/get-schema';

// mocking
vi.mock('../controllers', () => ({
	getWebsocketController: vi.fn(() => ({
		clients: new Set(),
	})),
}));
vi.mock('../../utils/get-schema', () => ({
	getSchema: vi.fn(),
}));
vi.mock('../../services', () => ({
	ItemsService: vi.fn(),
	MetaService: vi.fn(),
}));
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
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('ignore other message types', async () => {
		// initialize handler
		const handler = new ItemsHandler();
		const spy = vi.spyOn(handler, 'onMessage');
		// receive message
		emitter.emitAction('websocket.message', {
			client: mockClient(),
			message: { type: 'PONG' },
		});
		// expect nothing
		expect(spy).not.toBeCalled();
	});
	test('invalid collection should error', async () => {
		// initialize handler
		new ItemsHandler();
		(getSchema as Mock).mockImplementation(() => ({ collections: {} }));
		// receive message
		const fakeClient = mockClient();
		emitter.emitAction('websocket.message', {
			client: fakeClient,
			message: { type: 'ITEMS', collection: 'test', action: 'create', data: {} },
		});
		await delay(10); // 10ms to make sure the event is handled
		// expect error
		expect(fakeClient.send).toBeCalledWith(
			'{"type":"items","status":"error","error":{"code":"INVALID_COLLECTION","message":"The provided collection does not exists or is not accessible."}}'
		);
	});
	test('invalid collection should error', async () => {
		// initialize handler
		new ItemsHandler();
		(getSchema as Mock).mockImplementation(() => ({ collections: {} }));
		// receive message
		const fakeClient = mockClient();
		emitter.emitAction('websocket.message', {
			client: fakeClient,
			message: { type: 'ITEMS', collection: 'test', action: 'create', data: {} },
		});
		await delay(10); // 10ms to make sure the event is handled
		// expect error
		expect(fakeClient.send).toBeCalledWith(
			'{"type":"items","status":"error","error":{"code":"INVALID_COLLECTION","message":"The provided collection does not exists or is not accessible."}}'
		);
	});
});
