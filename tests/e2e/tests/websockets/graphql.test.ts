import { randomUUID } from 'node:crypto';
import { createDirectus, createItem, deleteItem, rest, staticToken, updateItem } from '@directus/sdk';
import { options, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { openSocket, type TestSocket } from '@utils/websocket.js';
import { afterAll, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

/** Opens a `graphql-transport-ws` connection and completes its handshake. */
async function openGraphqlSocket(): Promise<TestSocket> {
	const socket = await openSocket(`ws://localhost:${port}/graphql`, 'graphql-transport-ws');

	socket.send({ type: 'connection_init', payload: { access_token: 'admin' } });

	await socket.next((message) => message.type === 'connection_ack');

	return socket;
}

const socket = await openGraphqlSocket();

afterAll(() => {
	socket.close();
});

/** Subscribes to a collection and returns a reader for the events of that subscription. */
async function subscribe(id: string, event?: 'create' | 'update' | 'delete') {
	socket.send({
		id,
		type: 'subscribe',
		payload: {
			query: `subscription {
				${collections.plants}_mutated${event ? `(event: ${event})` : ''} {
					event
					data { id name }
				}
			}`,
		},
	});

	return (match?: (payload: any) => boolean) =>
		socket
			.next((message) => message.id === id && message.type === 'next' && (!match || match(message.payload)))
			.then((message) => message.payload.data[`${collections.plants}_mutated`]);
}

if (options.extras?.redis) {
	test('a graphql subscription reports create, update and delete', async () => {
		const next = await subscribe('all-events');

		const name = randomUUID();
		const created = await api.request(createItem(collections.plants, { name }));

		expect(await next((payload) => payload.data[`${collections.plants}_mutated`].event === 'create')).toEqual({
			event: 'create',
			data: { id: String(created.id), name },
		});

		const updatedName = randomUUID();
		await api.request(updateItem(collections.plants, created.id!, { name: updatedName }));

		expect(await next((payload) => payload.data[`${collections.plants}_mutated`].event === 'update')).toEqual({
			event: 'update',
			data: { id: String(created.id), name: updatedName },
		});

		await api.request(deleteItem(collections.plants, created.id!));

		expect(await next((payload) => payload.data[`${collections.plants}_mutated`].event === 'delete')).toMatchObject({
			event: 'delete',
		});

		socket.send({ id: 'all-events', type: 'complete' });
	});

	test('a graphql subscription can be narrowed to a single event', async () => {
		const next = await subscribe('updates-only', 'update');

		const name = randomUUID();
		const created = await api.request(createItem(collections.plants, { name }));

		const updatedName = randomUUID();
		await api.request(updateItem(collections.plants, created.id!, { name: updatedName }));

		// The create never arrives, so the first message is the update
		expect(await next()).toEqual({ event: 'update', data: { id: String(created.id), name: updatedName } });

		socket.send({ id: 'updates-only', type: 'complete' });
	});
}
