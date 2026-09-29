import { randomUUID } from 'node:crypto';
import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { options, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { openAuthenticatedSocket } from '@utils/websocket.js';
import { afterAll, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

const socket = await openAuthenticatedSocket(`ws://localhost:${port}/websocket`, 'admin');

afterAll(() => {
	socket.close();
});

// Realtime events are only delivered when the messenger is up
if (options.extras?.redis) {
	test('one connection can hold several subscriptions, told apart by their uid', async () => {
		const uids = ['first', 'second'];

		for (const uid of uids) {
			socket.send({ type: 'subscribe', collection: collections.plants, uid });

			// The server confirms a subscription by sending the current state as an `init` event
			await socket.next((message) => message.type === 'subscription' && message.event === 'init' && message.uid === uid); // prettier-ignore
		}

		const name = randomUUID();
		const created = await api.request(createItem(collections.plants, { name }));

		for (const uid of uids) {
			const message = await socket.next(
				(message) => message.type === 'subscription' && message.uid === uid && message.event === 'create',
			);

			expect(message.data).toEqual([expect.objectContaining({ id: created.id, name })]);
		}
	});

	test('unsubscribing by uid leaves the other subscriptions alone', async () => {
		socket.send({ type: 'unsubscribe', uid: 'first' });

		const name = randomUUID();
		await api.request(createItem(collections.plants, { name }));

		const remaining = await socket.next(
			(message) => message.type === 'subscription' && message.event === 'create' && message.data?.[0]?.name === name,
		);

		expect(remaining.uid).toBe('second');

		expect(
			await socket.silent(
				(message) => message.type === 'subscription' && message.uid === 'first' && message.data?.[0]?.name === name,
			),
		).toBe(true);
	});

	test('a subscription without a uid reports events without one', async () => {
		socket.send({ type: 'subscribe', collection: collections.plants });

		await socket.next(
			(message) => message.type === 'subscription' && message.event === 'init' && message.uid === undefined,
		);

		const name = randomUUID();
		await api.request(createItem(collections.plants, { name }));

		const message = await socket.next(
			(message) => message.type === 'subscription' && message.uid === undefined && message.data?.[0]?.name === name,
		);

		expect(message.event).toBe('create');
	});
}

test('the server answers a ping with a pong', async () => {
	socket.send({ type: 'ping' });

	expect(await socket.next((message) => message.type === 'pong')).toMatchObject({ type: 'pong' });
});
