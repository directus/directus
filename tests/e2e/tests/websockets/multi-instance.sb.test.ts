import { randomUUID } from 'node:crypto';
import { sandbox } from '@directus/sandbox';
import { createCollection, createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { openAuthenticatedSocket, openSocket } from '@utils/websocket.js';
import { afterAll, expect, test } from 'vitest';

const COLLECTION = 'ws_multi_instance';

/** Two nodes sharing a messenger, so an event raised on one has to reach a subscriber on the other. */
const directus = await sandbox(database, {
	port: sandboxPort(),
	inspect: false,
	prefix: 'ws-multi',
	instances: '2',
	extras: { redis: true },
	env: { DB_FILENAME: `directus_test_${getUID()}.db` },
	docker: { suffix: getUID() },
});

const [first, second] = directus.apis;

const api = createDirectus<any>(`http://localhost:${first!.port}`).with(rest()).with(staticToken('admin'));

afterAll(async () => {
	await directus.stop();
});

await api.request(
	createCollection({
		collection: COLLECTION,
		fields: [
			{
				field: 'id',
				type: 'integer',
				meta: { hidden: true, interface: 'input', readonly: true },
				schema: { is_primary_key: true, has_auto_increment: true },
			},
			{ field: 'name', type: 'string' },
		],
		schema: {},
		meta: { singleton: false },
	} as any),
);

test('an item created on one node reaches a subscriber on the other', async () => {
	const sockets = await Promise.all(
		directus.apis.map((instance) => openAuthenticatedSocket(`ws://localhost:${instance.port}/websocket`, 'admin')),
	);

	for (const socket of sockets) {
		socket.send({ type: 'subscribe', collection: COLLECTION, uid: 'cross' });
		await socket.next((message) => message.type === 'subscription' && message.event === 'init');
	}

	const name = randomUUID();
	const created = await api.request(createItem(COLLECTION, { name }));

	for (const socket of sockets) {
		const message = await socket.next(
			(message) => message.type === 'subscription' && message.event === 'create' && message.uid === 'cross',
		);

		expect(message.data).toEqual([expect.objectContaining({ id: created.id, name })]);
	}

	for (const socket of sockets) socket.close();
});

test('a graphql subscriber on the other node sees the same event', async () => {
	const socket = await openSocket(`ws://localhost:${second!.port}/graphql`, 'graphql-transport-ws');

	socket.send({ type: 'connection_init', payload: { access_token: 'admin' } });
	await socket.next((message) => message.type === 'connection_ack');

	socket.send({
		id: 'cross-gql',
		type: 'subscribe',
		payload: { query: `subscription { ${COLLECTION}_mutated { event data { id name } } }` },
	});

	const name = randomUUID();
	const created = await api.request(createItem(COLLECTION, { name }));

	const message = await socket.next((message) => message.id === 'cross-gql' && message.type === 'next');

	expect(message.payload.data[`${COLLECTION}_mutated`]).toEqual({
		event: 'create',
		data: { id: String(created.id), name },
	});

	socket.close();
});
