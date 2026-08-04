import { setImmediate } from 'node:timers/promises';
import type { Mock } from 'vitest';
import { expect, vi } from 'vitest';
import type { WebSocketInterface } from '../../../src/index.js';
import { createDirectus } from '../../../src/index.js';
import { realtime } from '../../../src/realtime/composable.js';
import type { WebSocketClient, WebSocketConfig } from '../../../src/realtime/types.js';
import type { DirectusClient } from '../../../src/types/client.js';

export const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

export class FakeWebSocket implements WebSocketInterface {
	static instances: FakeWebSocket[] = [];

	readonly readyState = 1;
	send: Mock<(data: string) => void> = vi.fn();

	close: Mock<(code?: number, reason?: string) => void> = vi.fn(() => {
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

	/** Deliver a server message and let the client's message loop pick it up. */
	async receive(message: Record<string, any>): Promise<void> {
		this.emit('message', { data: JSON.stringify(message) });
		await flush();
	}

	/** The messages the client sent, parsed. */
	get sent(): Record<string, any>[] {
		return this.send.mock.calls.map(([data]) => JSON.parse(data));
	}
}

/**
 * A client wired to FakeWebSocket, before any composables are applied, so tests that need
 * extra ones (auth for the handshake) can chain their own.
 */
export function createClient<Schema = any>(): DirectusClient<Schema> {
	FakeWebSocket.instances = [];

	return createDirectus<Schema>('http://localhost:8055', {
		globals: { WebSocket: FakeWebSocket },
	});
}

export async function openConnection<Schema = any>(
	config: WebSocketConfig = { reconnect: false },
): Promise<{ client: DirectusClient<Schema> & WebSocketClient<Schema>; socket: FakeWebSocket }> {
	const client = createClient<Schema>().with(realtime(config));

	const connecting = client.connect();
	const socket = await openSocket();
	await connecting;

	return { client, socket };
}

/** Wait for the next socket to be constructed and complete its handshake. */
export async function openSocket(index: number = FakeWebSocket.instances.length): Promise<FakeWebSocket> {
	await vi.waitFor(() => expect(FakeWebSocket.instances.length).toBeGreaterThan(index));
	const socket = FakeWebSocket.instances[index]!;
	socket.emit('open', {});
	await flush();

	return socket;
}

/** The rejections node reported as unhandled while `run` was in flight. */
export async function watchUnhandledRejections(run: () => Promise<void>): Promise<unknown[]> {
	const rejections: unknown[] = [];
	const onRejection = (reason: unknown) => rejections.push(reason);
	process.on('unhandledRejection', onRejection);

	try {
		await run();
		// node only reports a rejection as unhandled once the microtask queue has drained,
		// so the event loop has to turn before we can tell whether one was raised
		await setImmediate();
	} finally {
		process.off('unhandledRejection', onRejection);
	}

	return rejections;
}
