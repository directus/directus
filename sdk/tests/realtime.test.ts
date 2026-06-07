import { describe, expect, it, vi } from 'vitest';
import { realtime } from '../src/realtime/index.js';

class MockWebSocket {
	static instances: MockWebSocket[] = [];
	static authResponse: Record<string, any> | undefined = { type: 'auth', status: 'ok' };
	static autoOpen = true;

	readonly url: string;
	readonly sent: string[] = [];
	readyState = 0;
	private closed = false;
	private listeners = new Map<string, Set<(this: MockWebSocket, ev: any) => any>>();

	constructor(url: string) {
		this.url = url;
		MockWebSocket.instances.push(this);

		if (MockWebSocket.autoOpen) {
			queueMicrotask(() => this.open());
		}
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

			if (parsed?.type === 'auth' && MockWebSocket.authResponse) {
				queueMicrotask(() => {
					this.dispatch('message', { data: JSON.stringify(MockWebSocket.authResponse) });
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

	open() {
		this.readyState = 1;
		this.dispatch('open', new Event('open'));
	}

	message(message: Record<string, any> | string) {
		this.dispatch('message', { data: typeof message === 'string' ? message : JSON.stringify(message) });
	}

	error() {
		this.dispatch('error', new Event('error'));
	}

	dispatch(type: string, ev: any) {
		for (const listener of this.listeners.get(type) ?? []) {
			listener.call(this, ev);
		}
	}
}

describe('realtime lifecycle', () => {
	const createClient = (config = {}, overrides = {}) => {
		MockWebSocket.instances = [];
		MockWebSocket.authResponse = { type: 'auth', status: 'ok' };
		MockWebSocket.autoOpen = true;

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
			...overrides,
		} as any;

		return baseClient.with(
			realtime({
				authMode: 'handshake',
				connect: false,
				reconnect: false,
				...config,
			}),
		);
	};

	it('tracks connected, authenticated, and ready state', async () => {
		const lifecycleEvents: string[] = [];
		const sdk = createClient();

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
		const lifecycleEvents: string[] = [];
		const sdk = createClient();

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

	it('marks public connections ready after receiving an auth confirmation', async () => {
		const lifecycleEvents: string[] = [];
		const sdk = createClient({ authMode: 'public' });

		sdk.onWebSocket('authenticated', () => lifecycleEvents.push('authenticated'));
		sdk.onWebSocket('ready', () => lifecycleEvents.push('ready'));

		await sdk.connect();

		expect(sdk.isAuthenticated()).toBe(false);
		expect(sdk.isReady()).toBe(false);

		MockWebSocket.instances[0]!.message({ type: 'ping' });
		await vi.waitFor(() => expect(MockWebSocket.instances[0]!.sent).toContain(JSON.stringify({ type: 'pong' })));
		MockWebSocket.instances[0]!.message({ type: 'auth', status: 'ok' });
		await vi.waitFor(() => expect(sdk.isReady()).toBe(true));

		MockWebSocket.instances[0]!.message({ type: 'auth', status: 'ok' });
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(lifecycleEvents).toEqual(['authenticated', 'ready']);
	});

	it('resets readiness and re-authenticates after token expiration', async () => {
		const sdk = createClient({ authMode: 'public' });

		await sdk.connect();
		MockWebSocket.instances[0]!.message({ type: 'ping' });
		await vi.waitFor(() => expect(MockWebSocket.instances[0]!.sent).toContain(JSON.stringify({ type: 'pong' })));
		MockWebSocket.instances[0]!.message({ type: 'auth', status: 'ok' });
		await vi.waitFor(() => expect(sdk.isReady()).toBe(true));

		MockWebSocket.instances[0]!.message({
			type: 'auth',
			status: 'error',
			error: {
				code: 'TOKEN_EXPIRED',
				message: 'Token expired',
			},
		});

		await vi.waitFor(() =>
			expect(MockWebSocket.instances[0]!.sent).toContain(JSON.stringify({ access_token: 'token', type: 'auth' })),
		);

		MockWebSocket.instances[0]!.message({ type: 'auth', status: 'ok' });
		await vi.waitFor(() => expect(sdk.isReady()).toBe(true));
	});

	it('emits authenticated and ready immediately for strict auth clients', async () => {
		const lifecycleEvents: string[] = [];
		const sdk = createClient({ authMode: 'strict' });

		sdk.onWebSocket('authenticated', () => lifecycleEvents.push('authenticated'));
		sdk.onWebSocket('ready', () => lifecycleEvents.push('ready'));

		await sdk.connect();

		expect(MockWebSocket.instances[0]!.url).toBe('wss://example.com/websocket?access_token=token');
		expect(sdk.isAuthenticated()).toBe(true);
		expect(sdk.isReady()).toBe(true);
		expect(lifecycleEvents).toEqual(['authenticated', 'ready']);
	});

	it('waits for an in-flight connection when checking connected state', async () => {
		const sdk = createClient();
		MockWebSocket.autoOpen = false;

		const connectPromise = sdk.connect();
		const connectedPromise = sdk.isConnected();

		await vi.waitFor(() => expect(MockWebSocket.instances[0]).toBeDefined());
		MockWebSocket.instances[0]!.open();

		await connectPromise;
		await expect(connectedPromise).resolves.toBe(true);
	});

	it('rejects when handshake authentication cannot confirm', async () => {
		const sdk = createClient();

		MockWebSocket.authResponse = {
			type: 'auth',
			status: 'error',
			error: {
				code: 'AUTH_FAILED',
				message: 'Auth failed',
			},
		};

		await expect(sdk.connect()).rejects.toBe('Authentication failed while opening websocket connection');
	});

	it('rejects and resets connected state when a connection errors before opening', async () => {
		const sdk = createClient();
		MockWebSocket.autoOpen = false;

		const connectPromise = sdk.connect();
		await vi.waitFor(() => expect(MockWebSocket.instances[0]).toBeDefined());
		MockWebSocket.instances[0]!.error();

		await expect(connectPromise).rejects.toBeInstanceOf(Event);
		await expect(sdk.isConnected()).resolves.toBe(false);
		expect(sdk.isAuthenticated()).toBe(false);
		expect(sdk.isReady()).toBe(false);
	});
});
