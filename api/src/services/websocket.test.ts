import { describe, expect, test, vi } from 'vitest';
import type { WebSocketClient } from '../websocket/types.js';
import { WebSocketController, getWebSocketController } from '../websocket/controllers/index.js';
import type { Accountability } from '@directus/types';
import { WebSocketService } from './websocket.js';

vi.mock('../emitter');
vi.mock('../websocket/controllers/index');

function mockClient(accountability: Accountability | null = null) {
	return {
		on: vi.fn(),
		off: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
		accountability,
	} as unknown as WebSocketClient;
}

describe('WebSocketService', () => {
	test('get clients', () => {
		vi.mocked(getWebSocketController).mockReturnValue({
			clients: new Set([mockClient(), mockClient(), mockClient()]),
		} as unknown as WebSocketController);

		const wsService = new WebSocketService();
		expect(wsService.clients().size).toBe(3);
	});

	test('broadcast', () => {
		const clients = new Set([mockClient(), mockClient(), mockClient()]);
		const message = 'test 123';

		vi.mocked(getWebSocketController).mockReturnValue({ clients } as unknown as WebSocketController);

		const wsService = new WebSocketService();
		wsService.broadcast(message);

		for (const client of clients) {
			expect(client.send).toBeCalledWith(message);
		}
	});

	test('broadcast with role filter', () => {
		const clients = [mockClient({ user: 'test', role: 'test' }), mockClient({ user: 'test2', role: 'test2' })];
		const message = 'test 123';

		vi.mocked(getWebSocketController).mockReturnValue({ clients: new Set(clients) } as unknown as WebSocketController);

		const wsService = new WebSocketService();
		wsService.broadcast(message, { role: 'test' });

		expect(clients[0]!.send).toBeCalledWith(message);
		expect(clients[1]!.send).not.toBeCalled();
	});

	test('broadcast with user filter', () => {
		const clients = [mockClient({ user: 'test', role: 'test' }), mockClient({ user: 'test2', role: 'test2' })];
		const message = 'test 123';

		vi.mocked(getWebSocketController).mockReturnValue({ clients: new Set(clients) } as unknown as WebSocketController);

		const wsService = new WebSocketService();
		wsService.broadcast(message, { user: 'test2' });

		expect(clients[0]!.send).not.toBeCalled();
		expect(clients[1]!.send).toBeCalledWith(message);
	});
});
