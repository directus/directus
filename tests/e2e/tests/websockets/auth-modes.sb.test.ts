import { type sandbox as Sandbox, sandbox } from '@directus/sandbox';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

/** Seconds the server waits for a handshake before hanging up. */
const TIMEOUT = 2;

/**
 * `public` lets anyone in, `handshake` gives a client a moment to authenticate over the socket,
 * and `strict` only accepts a connection that already carries a token.
 */
const MODES = ['public', 'handshake', 'strict'] as const;

type State = 'open' | 'closed';

/** Opens a socket and reports whether it is still up once the handshake window has passed. */
function connect(url: string, onOpen?: (socket: WebSocket) => void): Promise<State> {
	return new Promise((resolve) => {
		let socket: WebSocket;

		try {
			socket = new WebSocket(url);
		} catch {
			resolve('closed');
			return;
		}

		let closed = false;

		socket.addEventListener('open', () => onOpen?.(socket));
		socket.addEventListener('error', () => (closed = true));
		socket.addEventListener('close', () => (closed = true));

		setTimeout(
			() => {
				const state = closed || socket.readyState !== socket.OPEN ? 'closed' : 'open';
				socket.close();
				resolve(state);
			},
			TIMEOUT * 1000 + 500,
		);
	});
}

for (const mode of MODES) {
	describe(`websocket auth in ${mode} mode`, () => {
		let directus: Awaited<ReturnType<typeof Sandbox>>;
		let url: string;

		beforeAll(async () => {
			directus = await sandbox(database, {
				port: sandboxPort(MODES.indexOf(mode)),
				inspect: false,
				prefix: `ws-auth-${mode}`,
				env: {
					WEBSOCKETS_REST_AUTH: mode,
					WEBSOCKETS_REST_AUTH_TIMEOUT: String(TIMEOUT),
					DB_FILENAME: `directus_test_${getUID()}_${mode}.db`,
				},
				docker: { suffix: `${getUID()}${mode}` },
			});

			url = `ws://localhost:${directus.apis[0]!.port}/websocket`;
		}, 120_000);

		afterAll(async () => {
			await directus.stop();
		});

		test(`a connection without any credentials is ${mode === 'public' ? 'kept' : 'closed'}`, async () => {
			expect(await connect(url)).toBe(mode === 'public' ? 'open' : 'closed');
		});

		test(`a connection that authenticates over the socket is ${mode === 'strict' ? 'closed' : 'kept'}`, async () => {
			const state = await connect(url, (socket) => {
				socket.send(JSON.stringify({ type: 'auth', access_token: 'admin' }));
			});

			// In strict mode the token has to be there before the connection is accepted
			expect(state).toBe(mode === 'strict' ? 'closed' : 'open');
		});

		test('a connection with a token in the query string is kept in every mode', async () => {
			expect(await connect(`${url}?access_token=admin`)).toBe('open');
		});
	});
}
