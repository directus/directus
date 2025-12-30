import { WebSocketService } from './websocket.js';
import { getWebSocketController, WebSocketController } from '../websocket/controllers/index.js';
import type { WebSocketClient } from '../websocket/types.js';
import type { Accountability } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../emitter');
vi.mock('../websocket/controllers/index');

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO
vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		WEBSOCKETS_ENABLED: true,
		WEBSOCKETS_REST_ENABLED: true,
		EXTENSIONS_PATH: './extensions',
		EMAIL_TEMPLATES_PATH: './templates',
	}),
}));

afterEach(() => {
	vi.clearAllMocks();
});

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
		const clients = [
			mockClient({ user: 'test', role: 'test' } as Accountability),
			mockClient({ user: 'test2', role: 'test2' } as Accountability),
		];

		const message = 'test 123';

		vi.mocked(getWebSocketController).mockReturnValue({ clients: new Set(clients) } as unknown as WebSocketController);

		const wsService = new WebSocketService();
		wsService.broadcast(message, { role: 'test' });

		expect(clients[0]!.send).toBeCalledWith(message);
		expect(clients[1]!.send).not.toBeCalled();
	});

	test('broadcast with user filter', () => {
		const clients = [
			mockClient({ user: 'test', role: 'test' } as Accountability),
			mockClient({ user: 'test2', role: 'test2' } as Accountability),
		];

		const message = 'test 123';

		vi.mocked(getWebSocketController).mockReturnValue({ clients: new Set(clients) } as unknown as WebSocketController);

		const wsService = new WebSocketService();
		wsService.broadcast(message, { user: 'test2' });

		expect(clients[0]!.send).not.toBeCalled();
		expect(clients[1]!.send).toBeCalledWith(message);
	});
});
