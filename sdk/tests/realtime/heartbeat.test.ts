import { describe, expect, test, vi } from 'vitest';
import type { WebSocketInterface } from '../../src/index.js';
import { createDirectus } from '../../src/index.js';
import { pong } from '../../src/realtime/commands/pong.js';
import { realtime } from '../../src/realtime/composable.js';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

class FakeWebSocket implements WebSocketInterface {
	static instances: FakeWebSocket[] = [];

	readonly readyState = 1;
	send = vi.fn((_data: string): void => {});
	close = vi.fn((_code?: number, _reason?: string): void => {
		this.emit('close', { code: 1006 });
	});

	private listeners: Record<string, Set<(ev: any) => void>> = {
		open: new Set(),
		message: new Set(),
		error: new Set(),
		close: new Set(),
	};

	constructor(public url: string) {
		FakeWebSocket.instances.push(this);
	}

	addEventListener(type: string, listener: (ev: any) => void): void {
		this.listeners[type]?.add(listener);
	}

	removeEventListener(type: string, listener: (ev: any) => void): void {
		this.listeners[type]?.delete(listener);
	}

	emit(type: string, event: unknown): void {
		this.listeners[type]?.forEach((listener) => listener.call(this, event));
	}
}

async function openConnection() {
	FakeWebSocket.instances = [];

	const client = createDirectus('http://localhost:8055', {
		globals: { WebSocket: FakeWebSocket },
	}).with(realtime({ reconnect: false }));

	const connecting = client.connect();

	await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
	const socket = FakeWebSocket.instances[0]!;
	socket.emit('open', {});
	await connecting;

	return { client, socket };
}

function sendPing(socket: FakeWebSocket) {
	socket.emit('message', { data: JSON.stringify({ type: 'ping' }) });
}

describe('realtime heartbeat', () => {
	test('replies to a ping with a pong while the connection is open', async () => {
		const { client, socket } = await openConnection();

		sendPing(socket);
		await flush();

		expect(socket.send).toHaveBeenCalledWith(pong());

		client.disconnect();
	});

	test('does not raise an unhandled rejection when the connection closes during a ping (#25078)', async () => {
		const { socket } = await openConnection();

		const rejections: unknown[] = [];
		const onRejection = (reason: unknown) => rejections.push(reason);
		process.on('unhandledRejection', onRejection);

		try {
			// The ping resolves, but the socket closes before the awaited handler resumes,
			// so `state.connection` is already gone by the time the pong would be sent.
			sendPing(socket);
			socket.emit('close', { code: 1006 });
			await flush();
			await flush();
		} finally {
			process.off('unhandledRejection', onRejection);
		}

		expect(rejections).toEqual([]);
	});
});
