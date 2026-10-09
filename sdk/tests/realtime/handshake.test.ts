import { describe, expect, test } from 'vitest';
import { staticToken } from '../../src/auth/static.js';
import { realtime } from '../../src/realtime/composable.js';
import { createClient, openSocket, watchUnhandledRejections } from './helpers/fake-websocket.js';

/** openConnection() can't be used here: the handshake needs an authenticated client. */
function createAuthedClient() {
	return createClient()
		.with(staticToken('test-token'))
		.with(realtime({ reconnect: false }));
}

describe('realtime handshake authentication', () => {
	test('resolves the connection once the handshake is confirmed', async () => {
		const client = createAuthedClient();
		const connecting = client.connect();

		const socket = await openSocket();
		expect(socket.sent).toContainEqual({ type: 'auth', access_token: 'test-token' });

		await socket.receive({ type: 'auth', status: 'ok' });

		await expect(connecting).resolves.toBe(socket);

		client.disconnect();
	});

	test('rejects the connection when the handshake is refused', async () => {
		const client = createAuthedClient();
		// the assertion has to be attached up front, the rejection lands before the await below
		const refused = expect(client.connect()).rejects.toBe('Authentication failed while opening websocket connection');

		const socket = await openSocket();
		await socket.receive({ type: 'auth', status: 'error', error: { code: 'AUTH_FAILED', message: 'nope' } });

		await refused;

		client.disconnect();
	});

	test.each([
		{ outcome: 'closes', event: 'close', payload: { code: 1006 } },
		{ outcome: 'errors', event: 'error', payload: new Event('error') },
	])(
		'does not raise an unhandled rejection when the socket $outcome mid-handshake (#27929)',
		async ({ event, payload }) => {
			const client = createAuthedClient();

			const connecting = client.connect().catch(() => {});
			const socket = await openSocket();

			const rejections = await watchUnhandledRejections(async () => {
				// The auth message is sent and the handshake parks on the confirmation
				// that this socket is never going to deliver.
				socket.emit(event, payload);
				await connecting;
			});

			expect(rejections).toEqual([]);
		},
	);
});
