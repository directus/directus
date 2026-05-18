import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDirectus, realtime } from '../src/index.js';
import type { WebSocketCloseEvent, WebSocketInterface } from '../src/types/globals.js';

class MockWebSocket implements WebSocketInterface {
	static instances: MockWebSocket[] = [];

	listeners = new Map<string, Set<(event: any) => void>>();
	readyState = 0;
	send = vi.fn();
	close = vi.fn();

	constructor(_url: string, _protocols?: string | string[]) {
		MockWebSocket.instances.push(this);
	}

	addEventListener(type: string, listener: (this: WebSocketInterface, ev: any) => any) {
		if (!this.listeners.has(type)) this.listeners.set(type, new Set());
		this.listeners.get(type)?.add(listener);
	}

	removeEventListener(type: string, listener: (this: WebSocketInterface, ev: any) => any) {
		this.listeners.get(type)?.delete(listener);
	}

	dispatch(type: string, event: any) {
		for (const listener of this.listeners.get(type) ?? []) {
			listener.call(this, event);
		}
	}
}

afterEach(() => {
	MockWebSocket.instances = [];
	vi.clearAllMocks();
});

describe('realtime', () => {
	it('passes close events to registered websocket handlers', async () => {
		const client = createDirectus('http://example.com', {
			globals: {
				WebSocket: MockWebSocket,
			},
		}).with(
			realtime({
				authMode: 'public',
				heartbeat: false,
				reconnect: false,
			}),
		);

		const onClose = vi.fn();
		client.onWebSocket('close', onClose);

		const connection = client.connect();
		await new Promise((resolve) => setTimeout(resolve, 0));
		const socket = MockWebSocket.instances[0]!;
		socket.dispatch('open', new Event('open'));

		await expect(connection).resolves.toBe(socket);

		const closeEvent = Object.assign(new Event('close'), {
			code: 1000,
			reason: 'done',
			wasClean: true,
		}) as WebSocketCloseEvent;

		socket.dispatch('close', closeEvent);

		expect(onClose).toHaveBeenCalledWith(closeEvent);
	});
});
