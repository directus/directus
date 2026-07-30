import { describe, expect, test, vi } from 'vitest';
import { staticToken } from '../../src/auth/static.js';
import type { WebSocketInterface } from '../../src/index.js';
import { createDirectus } from '../../src/index.js';
import { realtime } from '../../src/realtime/composable.js';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

class FakeWebSocket implements WebSocketInterface {
	static instances: FakeWebSocket[] = [];

	readonly readyState = 1;
	send = () => {};
	close = () => {};

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

function createHandshakeClient() {
	FakeWebSocket.instances = [];

	return createDirectus('http://localhost:8055', {
		globals: { WebSocket: FakeWebSocket },
	})
		.with(staticToken('test-token'))
		.with(realtime({ reconnect: false }));
}

async function watchUnhandledRejections(run: () => Promise<void>) {
	const rejections: unknown[] = [];
	const onRejection = (reason: unknown) => rejections.push(reason);
	process.on('unhandledRejection', onRejection);

	try {
		await run();
	} finally {
		process.off('unhandledRejection', onRejection);
	}

	return rejections;
}

describe('realtime handshake authentication (#27929)', () => {
	test('does not raise an unhandled rejection when the socket closes mid-handshake', async () => {
		const client = createHandshakeClient();

		const connecting = client.connect().catch(() => {
			/* the outer promise is expected to reject, that's not under test here */
		});

		await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
		const socket = FakeWebSocket.instances[0]!;

		const rejections = await watchUnhandledRejections(async () => {
			// The auth message is sent and the handshake starts waiting for a confirmation,
			// but the socket closes before that confirmation ever arrives.
			socket.emit('open', {});
			await flush();
			socket.emit('close', { code: 1006 });
			await connecting;
			await flush();
			await flush();
		});

		expect(rejections).toEqual([]);
	});

	test('does not raise an unhandled rejection when the socket errors mid-handshake', async () => {
		const client = createHandshakeClient();

		const connecting = client.connect().catch(() => {
			/* the outer promise is expected to reject, that's not under test here */
		});

		await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
		const socket = FakeWebSocket.instances[0]!;

		const rejections = await watchUnhandledRejections(async () => {
			socket.emit('open', {});
			await flush();
			socket.emit('error', new Event('error'));
			await connecting;
			await flush();
			await flush();
		});

		expect(rejections).toEqual([]);
	});
});
