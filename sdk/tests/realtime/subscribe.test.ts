import { describe, expect, test } from 'vitest';
import { FakeWebSocket, nextSocket, openConnection, openSocket } from './fake-websocket.js';

interface Schema {
	plants: { id: number; name: string }[];
}

const init = (uid: string) => ({ type: 'subscription', event: 'init', uid, data: [] });
const created = (uid: string, name: string) => ({ type: 'subscription', event: 'create', uid, data: [{ name }] });

const ended = { done: true, value: undefined };

describe('realtime subscriptions', () => {
	test('delivers messages that arrived before the first pull (#27859)', async () => {
		const { client, socket } = await openConnection<Schema>();
		const { subscription } = await client.subscribe('plants', { uid: 'a' });

		// Both arrive before the consumer starts iterating.
		await socket.receive(init('a'));
		await socket.receive(created('a', 'Alocasia Frydek'));

		await expect(subscription.next()).resolves.toMatchObject({ done: false, value: { event: 'init' } });
		await expect(subscription.next()).resolves.toMatchObject({ done: false, value: { event: 'create' } });

		client.disconnect();
	});

	test('delivers every frame of a burst arriving in one batch', async () => {
		const { client, socket } = await openConnection<Schema>();
		const { subscription } = await client.subscribe('plants', { uid: 'a' });

		// No microtask between the frames, so nothing can re-register a one-shot listener.
		await socket.receive(init('a'), created('a', 'one'), created('a', 'two'));

		await expect(subscription.next()).resolves.toMatchObject({ value: { event: 'init' } });
		await expect(subscription.next()).resolves.toMatchObject({ value: { data: [{ name: 'one' }] } });
		await expect(subscription.next()).resolves.toMatchObject({ value: { data: [{ name: 'two' }] } });

		client.disconnect();
	});

	test('keeps messages that arrive while the consumer is busy', async () => {
		const { client, socket } = await openConnection<Schema>();
		const { subscription } = await client.subscribe('plants', { uid: 'a' });

		const parked = subscription.next();
		await socket.receive(init('a'));
		await expect(parked).resolves.toMatchObject({ value: { event: 'init' } });

		// Nobody is pulling while these come in.
		await socket.receive(created('a', 'one'));
		await socket.receive(created('a', 'two'));

		await expect(subscription.next()).resolves.toMatchObject({ value: { data: [{ name: 'one' }] } });
		await expect(subscription.next()).resolves.toMatchObject({ value: { data: [{ name: 'two' }] } });

		client.disconnect();
	});

	test('ignores messages for other subscriptions', async () => {
		const { client, socket } = await openConnection<Schema>();
		const { subscription } = await client.subscribe('plants', { uid: 'a' });

		await socket.receive(created('b', 'not mine'));
		await socket.receive(created('a', 'mine'));

		await expect(subscription.next()).resolves.toMatchObject({ value: { data: [{ name: 'mine' }] } });

		client.disconnect();
	});

	test('throws on a subscribe error carrying its uid, leaving other subscriptions alone', async () => {
		const { client, socket } = await openConnection<Schema>();
		const rejected = await client.subscribe('plants', { uid: 'a' });
		const other = await client.subscribe('plants', { uid: 'b' });

		// The API sends the uid of the message that caused the error.
		await socket.receive({
			type: 'subscribe',
			status: 'error',
			uid: 'a',
			error: { code: 'INVALID_COLLECTION', message: 'The provided collection does not exists or is not accessible.' },
		});

		await expect(rejected.subscription.next()).rejects.toMatchObject({ type: 'subscribe', status: 'error' });

		await socket.receive(created('b', 'still alive'));
		await expect(other.subscription.next()).resolves.toMatchObject({ value: { data: [{ name: 'still alive' }] } });

		client.disconnect();
	});

	test('throws on a subscribe error without a uid, which cannot be targeted', async () => {
		const { client, socket } = await openConnection<Schema>();
		const first = await client.subscribe('plants', { uid: 'a' });
		const second = await client.subscribe('plants', { uid: 'b' });

		// An older API, or an error the server cannot attribute, arrives without a uid, so every open
		// subscription has to fail.
		await socket.receive({
			type: 'subscribe',
			status: 'error',
			error: { code: 'INVALID_PAYLOAD', message: 'Invalid query' },
		});

		await expect(first.subscription.next()).rejects.toMatchObject({ type: 'subscribe', status: 'error' });
		await expect(second.subscription.next()).rejects.toMatchObject({ type: 'subscribe', status: 'error' });

		client.disconnect();
	});

	test('ends the stream on unsubscribe', async () => {
		const { client, socket } = await openConnection<Schema>();
		const { subscription, unsubscribe } = await client.subscribe('plants', { uid: 'a' });

		const parked = subscription.next();
		unsubscribe();

		await expect(parked).resolves.toEqual(ended);
		expect(socket.sent).toContainEqual({ type: 'unsubscribe', uid: 'a' });

		client.disconnect();
	});

	test('ends the stream when the connection closes and reconnecting is disabled', async () => {
		const { socket, client } = await openConnection<Schema>({ reconnect: false });
		const { subscription } = await client.subscribe('plants', { uid: 'a' });

		const parked = subscription.next();
		socket.emit('close', { code: 1006 });

		await expect(parked).resolves.toEqual(ended);
	});

	test('ends the stream on a manual disconnect even when reconnecting is enabled', async () => {
		const { client } = await openConnection<Schema>({ reconnect: { delay: 100, retries: 5 } });
		const { subscription } = await client.subscribe('plants', { uid: 'a' });

		const parked = subscription.next();
		client.disconnect();

		await expect(parked).resolves.toEqual(ended);
	});

	test('resumes on the new connection after a reconnect', async () => {
		const { client, socket } = await openConnection<Schema>({ reconnect: { delay: 100, retries: 5 } });
		const { subscription } = await client.subscribe('plants', { uid: 'a' });

		const parked = subscription.next();
		socket.emit('close', { code: 1006 });

		const reconnected = await openSocket();

		expect(reconnected.sent).toContainEqual({ uid: 'a', collection: 'plants', type: 'subscribe' });

		await reconnected.receive(created('a', 'after reconnect'));

		await expect(parked).resolves.toMatchObject({ value: { data: [{ name: 'after reconnect' }] } });

		client.disconnect();
	});

	test('keeps the stream open across failing retries and ends when they run out', async () => {
		const { client, socket } = await openConnection<Schema>({ reconnect: { delay: 100, retries: 2 } });
		const { subscription } = await client.subscribe('plants', { uid: 'a' });

		const parked = subscription.next();
		socket.emit('close', { code: 1006 });

		// Every attempt fails, and each failure has to schedule the next one.
		for (let attempt = 0; attempt < 2; attempt++) {
			const retried = await nextSocket();
			retried.emit('close', { code: 1006 });
		}

		// Two retries, so three sockets in total and no fourth.
		expect(FakeWebSocket.instances).toHaveLength(3);

		await expect(parked).resolves.toEqual(ended);
	});

	test('cleans up when the subscribe message cannot be sent', async () => {
		const { client, socket } = await openConnection<Schema>({ reconnect: { delay: 100, retries: 5 } });

		socket.send.mockImplementationOnce(() => {
			throw new Error('connection gone');
		});

		await expect(client.subscribe('plants', { uid: 'a' })).rejects.toThrow('connection gone');

		// Nothing is subscribed, so a reconnect must not re-send it.
		socket.emit('close', { code: 1006 });
		const reconnected = await openSocket();

		expect(reconnected.sent).toEqual([]);

		client.disconnect();
	});
});
