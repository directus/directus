import { describe, expect, test } from 'vitest';
import { openConnection, openSocket } from './helpers/fake-websocket.js';

describe('realtime subscriptions', () => {
	test('only replays the still active subscriptions after a reconnect', async () => {
		const { client, socket } = await openConnection({ reconnect: { delay: 100, retries: 3 } });

		await client.subscribe('articles', { uid: 'kept' });
		const dropped = await client.subscribe('articles', { uid: 'dropped' });

		dropped.unsubscribe();

		// drop the connection so the client replays what it thinks is still subscribed
		socket.emit('close', { code: 1006 });

		const reconnected = await openSocket();
		const replayed = reconnected.sent.filter((message) => message['type'] === 'subscribe');

		expect(replayed.map((message) => message['uid'])).toEqual(['kept']);

		client.disconnect();
	});
});
