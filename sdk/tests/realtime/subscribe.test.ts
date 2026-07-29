import { describe, expect, test } from 'vitest';
import { openConnection, openSocket } from './fake-websocket.js';

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

	test('throws when the subscription is rejected', async () => {
		const { client, socket } = await openConnection<Schema>();
		const { subscription } = await client.subscribe('plants', { uid: 'a' });

		await socket.receive({
			type: 'subscribe',
			status: 'error',
			uid: 'a',
			error: { code: 'INVALID_PAYLOAD', message: 'Invalid query' },
		});

		await expect(subscription.next()).rejects.toMatchObject({ type: 'subscribe', status: 'error' });

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
});
