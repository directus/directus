import { sandbox } from '@directus/sandbox';
import { createCollection, createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { expect, test } from 'vitest';

/**
 * Regression test for GHSA-97xr-jchp-xm3c.
 */

type WireMessage = Record<string, any>;

/** Minimal raw WebSocket client because the Realtime SDK cant reproduce this currently */
function connect(url: string) {
	const ws = new WebSocket(url);
	const queue: WireMessage[] = [];
	const waiters: Array<{ predicate: (m: WireMessage) => boolean; resolve: (m: WireMessage) => void }> = [];

	ws.addEventListener('message', (event) => {
		let message: WireMessage;

		try {
			message = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data));
		} catch {
			return;
		}

		const index = waiters.findIndex((w) => w.predicate(message));

		if (index !== -1) {
			waiters.splice(index, 1)[0]!.resolve(message);
		} else {
			queue.push(message);
		}
	});

	return {
		opened: new Promise<void>((resolve, reject) => {
			ws.addEventListener('open', () => resolve());
			ws.addEventListener('error', () => reject(new Error('WebSocket connection failed')));
		}),
		send: (message: WireMessage) => ws.send(JSON.stringify(message)),
		waitFor: (predicate: (m: WireMessage) => boolean, timeout = 30_000) => {
			const buffered = queue.findIndex(predicate);
			if (buffered !== -1) return Promise.resolve(queue.splice(buffered, 1)[0]!);

			return new Promise<WireMessage>((resolve, reject) => {
				const timer = setTimeout(() => reject(new Error('Timed out waiting for WebSocket message')), timeout);

				waiters.push({
					predicate,
					resolve: (message) => {
						clearTimeout(timer);
						resolve(message);
					},
				});
			});
		},
		close: () => ws.close(),
	};
}

const isAuthError = (m: WireMessage) => m['type'] === 'auth' && m['status'] === 'error';
const isItemsResponse = (m: WireMessage) => m['type'] === 'items';

test(
	'a public WebSocket client cannot read private data after a failed auth attempt',
	{ timeout: 120_000 },
	async () => {
		const directus = await sandbox(database, {
			env: {
				WEBSOCKETS_ENABLED: 'true',
				WEBSOCKETS_REST_ENABLED: 'true',
				WEBSOCKETS_REST_AUTH: 'public',
				WEBSOCKETS_REST_PATH: '/websocket',
				DB_FILENAME: `directus_test_${getUID()}.db`,
			},
		});

		try {
			const port = directus.apis[0]!.port;
			const collection = `vf_ws_articles_${getUID()}`;
			const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

			// Create a non-system collection holding data the public role has no permission to read.
			await api.request(
				createCollection({
					collection,
					fields: [
						{
							field: 'id',
							type: 'integer',
							schema: { is_primary_key: true, has_auto_increment: true },
							meta: { hidden: true },
						},
						{ field: 'secret', type: 'string', schema: {}, meta: {} },
					],
					schema: {},
					meta: { singleton: false },
				}),
			);

			await api.request(createItem(collection, { secret: 'top secret' }));

			const socket = connect(`ws://localhost:${port}/websocket`);
			await socket.opened;

			socket.send({ type: 'auth', access_token: 'definitely-invalid', uid: 'force-null-auth' });
			const authResult = await socket.waitFor(isAuthError);
			expect(authResult['error']?.code).toBe('AUTH_FAILED');

			// Attempt the read that previously leaked data with escalated (null/system) accountability.
			socket.send({ type: 'items', collection, action: 'read', uid: 'attack-read' });

			const response = await socket.waitFor(isItemsResponse);
			socket.close();

			// The read must be rejected as the public role, never returning the private rows.
			expect(response['status']).toBe('error');
			expect(response['error']?.code).toBe('FORBIDDEN');
			expect(response['data']).toBeUndefined();
		} finally {
			await directus.stop();
		}
	},
);
