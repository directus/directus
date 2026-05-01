import { describe, expect, it, vi } from 'vitest';
import { realtime } from '../src/realtime/index.js';

class MockWebSocket {
	static instances: MockWebSocket[] = [];

	readonly url: string;
	readonly sent: string[] = [];
	readyState = 0;
	private closed = false;
	private listeners = new Map<string, Set<(this: MockWebSocket, ev: any) => any>>();

	constructor(url: string) {
		this.url = url;
		MockWebSocket.instances.push(this);

		queueMicrotask(() => {
			this.readyState = 1;
			this.dispatch('open', new Event('open'));
		});
	}

	addEventListener(type: string, listener: (this: MockWebSocket, ev: any) => any) {
		if (!this.listeners.has(type)) this.listeners.set(type, new Set());
		this.listeners.get(type)?.add(listener);
	}

	removeEventListener(type: string, listener: (this: MockWebSocket, ev: any) => any) {
		this.listeners.get(type)?.delete(listener);
	}

	send(data: string) {
		this.sent.push(data);

		try {
			const parsed = JSON.parse(data);

			if (parsed?.type === 'auth') {
				queueMicrotask(() => {
					this.dispatch('message', { data: JSON.stringify({ type: 'auth', status: 'ok' }) });
				});
			}
		} catch {
			/* ignore */
		}
	}

	close() {
		if (this.closed) return;

		this.closed = true;
		this.readyState = 3;
		this.dispatch('close', new Event('close'));
	}

	private dispatch(type: string, ev: any) {
		for (const listener of this.listeners.get(type) ?? []) {
			listener.call(this, ev);
		}
	}
}

describe('realtime lifecycle', () => {
	it('tracks connected, authenticated, and ready state', async () => {
		MockWebSocket.instances = [];

		const lifecycleEvents: string[] = [];
		const baseClient = {
			url: new URL('https://example.com'),
			getToken: vi.fn().mockResolvedValue('token'),
			globals: {
				URL,
				WebSocket: MockWebSocket as any,
				fetch: vi.fn() as any,
				logger: {
					log: vi.fn(),
					info: vi.fn(),
					warn: vi.fn(),
					error: vi.fn(),
				},
			},
			with<Extension extends object>(extension: (client: any) => Extension) {
				return Object.assign(this, extension(this as any));
			},
		} as any;

		const sdk = baseClient.with(
			realtime({
			authMode: 'handshake',
			connect: false,
			reconnect: false,
			}),
		);

		sdk.onWebSocket('connected', () => lifecycleEvents.push('connected'));
		sdk.onWebSocket('authenticated', () => lifecycleEvents.push('authenticated'));
		sdk.onWebSocket('ready', () => lifecycleEvents.push('ready'));

		await sdk.connect();

		expect(await sdk.isConnected()).toBe(true);
		expect(sdk.isAuthenticated()).toBe(true);
		expect(sdk.isReady()).toBe(true);
		expect(lifecycleEvents).toEqual(['connected', 'authenticated', 'ready']);

		sdk.disconnect();
		expect(await sdk.isConnected()).toBe(false);
		expect(sdk.isAuthenticated()).toBe(false);
		expect(sdk.isReady()).toBe(false);
	});

	it('re-emits the lifecycle after reconnect', async () => {
		MockWebSocket.instances = [];

		const lifecycleEvents: string[] = [];
		const baseClient = {
			url: new URL('https://example.com'),
			getToken: vi.fn().mockResolvedValue('token'),
			globals: {
				URL,
				WebSocket: MockWebSocket as any,
				fetch: vi.fn() as any,
				logger: {
					log: vi.fn(),
					info: vi.fn(),
					warn: vi.fn(),
					error: vi.fn(),
				},
			},
			with<Extension extends object>(extension: (client: any) => Extension) {
				return Object.assign(this, extension(this as any));
			},
		} as any;

		const sdk = baseClient.with(
			realtime({
			authMode: 'handshake',
			connect: false,
			reconnect: false,
			}),
		);

		sdk.onWebSocket('connected', () => lifecycleEvents.push('connected'));
		sdk.onWebSocket('authenticated', () => lifecycleEvents.push('authenticated'));
		sdk.onWebSocket('ready', () => lifecycleEvents.push('ready'));

		await sdk.connect();
		sdk.disconnect();

		expect(sdk.isReady()).toBe(false);

		await sdk.connect();

		expect(lifecycleEvents).toEqual(['connected', 'authenticated', 'ready', 'connected', 'authenticated', 'ready']);
		expect(sdk.isReady()).toBe(true);
	});
});