import { describe, expect, test } from 'vitest';
import { pong } from '../../src/realtime/commands/pong.js';
import type { FakeWebSocket } from './helpers/fake-websocket.js';
import { flush, openConnection } from './helpers/fake-websocket.js';

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
