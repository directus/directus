import { describe, expect, it, vi } from 'vitest';
import { realtime } from './composable.js';

describe('Realtime composable', () => {
	it('should authenticate websocket in handshake mode', async () => {
		const sendMock = vi.fn();

		class MockWebSocket {
			onopen: ((ev: Event) => void) | null = null;
			onmessage: ((ev: MessageEvent) => void) | null = null;

			constructor(_url: string) {
				setTimeout(() => {
					this.onopen?.(new Event('open'));
				}, 0);
			}

			send(data: string) {
				sendMock(data);

				const parsed = JSON.parse(data);

				if (parsed.type === 'auth') {
					setTimeout(() => {
						this.onmessage?.(
							new MessageEvent('message', {
								data: JSON.stringify({
									type: 'auth',
									status: 'ok',
								}),
							}),
						);
					}, 0);
				}
			}

			addEventListener(event: string, cb: any) {
				if (event === 'open') this.onopen = cb;
				if (event === 'message') this.onmessage = cb;
			}

			removeEventListener() {}
			close() {}
		}

		const client: any = {
			url: new URL('http://localhost'),
			globals: {
				WebSocket: MockWebSocket,
				URL,
				logger: console,
			},
			getToken: vi.fn(async () => 'token-a'),
		};

		const rt = realtime({ authMode: 'handshake' })(client);

		await rt.connect();

		await new Promise((r) => setTimeout(r, 50));

		expect(sendMock).toHaveBeenCalled();
		expect(sendMock.mock.calls[0][0]).toContain('"type":"auth"');
	});

	it('should handle TOKEN_EXPIRED without retrying if no refresh is implemented', async () => {
		const sendMock = vi.fn();

		const tokenMock = vi.fn().mockResolvedValue('token-a');

		class MockWebSocket {
			onopen: ((ev: Event) => void) | null = null;
			onmessage: ((ev: MessageEvent) => void) | null = null;

			constructor(_url: string) {
				setTimeout(() => {
					this.onopen?.(new Event('open'));
				}, 0);
			}

			send(data: string) {
				sendMock(data);

				const parsed = JSON.parse(data);

				if (parsed.type === 'auth') {
					// Auth success first
					setTimeout(() => {
						this.onmessage?.(
							new MessageEvent('message', {
								data: JSON.stringify({
									type: 'auth',
									status: 'ok',
								}),
							}),
						);
					}, 0);

					// Then token expiry error
					setTimeout(() => {
						this.onmessage?.(
							new MessageEvent('message', {
								data: JSON.stringify({
									type: 'auth',
									status: 'error',
									error: {
										code: 'TOKEN_EXPIRED',
										message: 'Expired token',
									},
								}),
							}),
						);
					}, 10);
				}
			}

			addEventListener(event: string, cb: any) {
				if (event === 'open') this.onopen = cb;
				if (event === 'message') this.onmessage = cb;
			}

			removeEventListener() {}
			close() {}
		}

		const client: any = {
			url: new URL('http://localhost'),
			globals: {
				WebSocket: MockWebSocket,
				URL,
				logger: console,
			},
			getToken: tokenMock,
		};

		const rt = realtime({ authMode: 'handshake' })(client);

		await rt.connect();

		await new Promise((r) => setTimeout(r, 200));

		// ✅ Auth was sent once
		expect(sendMock.mock.calls[0][0]).toContain('"type":"auth"');
		expect(sendMock.mock.calls[0][0]).toContain('"type":"auth"');

		// ✅ Token was fetched once (no refresh retry exists)
		expect(tokenMock).toHaveBeenCalledTimes(1);

		// ✅ No second auth attempt happened
		expect(sendMock.mock.calls.length).toBe(1);
	});
});
