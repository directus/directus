import { randomUUID } from 'node:crypto';
import { sandbox } from '@directus/sandbox';
import {
	createCollection,
	createContentVersion,
	createDirectus,
	createItem,
	deleteItem,
	rest,
	saveToContentVersion,
	staticToken,
	updateItem,
	updateSettings,
} from '@directus/sdk';
import { openCollab } from '@utils/collab.js';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { afterAll, beforeEach, expect, test } from 'vitest';
import { createRestrictedUser } from './users.js';

const COLLECTION = 'collab_multi_instance';

/** Two nodes sharing a messenger, so a room spans both of them. */
const directus = await sandbox(database, {
	port: sandboxPort(),
	inspect: false,
	prefix: 'collab-multi',
	instances: '2',
	extras: { redis: true, license: true },
	env: {
		LICENSE_KEY: 'D0000-00000-00000-00000-0000K',
		DB_FILENAME: `directus_test_${getUID()}.db`,
	},
	docker: { suffix: getUID() },
});

const ports = directus.apis.map((instance) => instance.port);

const api = createDirectus<any>(`http://localhost:${ports[0]}`).with(rest()).with(staticToken('admin'));

afterAll(async () => {
	await directus.stop();
});

await api.request(
	createCollection({
		collection: COLLECTION,
		fields: [
			{
				field: 'id',
				type: 'uuid',
				meta: { hidden: true, interface: 'input', readonly: true, special: ['uuid'] },
				schema: { is_primary_key: true },
			},
			{ field: 'title', type: 'string' },
		],
		schema: {},
		meta: { singleton: false, versioning: true },
	} as any),
);

const clients: { close: () => void }[] = [];

afterAll(() => {
	for (const client of clients) client.close();
});

beforeEach(async () => {
	// One test turns collaborative editing off cluster wide, so it is re-enabled before each
	await api.request(updateSettings({ collaborative_editing_enabled: true } as any));
});

async function client(node: 0 | 1, token = 'admin') {
	const collab = await openCollab(ports[node]!, token);
	clients.push(collab);
	return collab;
}

async function item(values: Record<string, unknown> = {}) {
	const created = await api.request(createItem(COLLECTION, { title: 'Item', ...values } as any));
	return created.id as string;
}

/** One client on each node, both in the same room. */
async function acrossNodes(id: string, version: string | null = null) {
	const first = await client(0);
	const init = await first.join(COLLECTION, id, version);

	const second = await client(1);
	await second.join(COLLECTION, id, version);

	await first.waitFor('join');

	return { first, second, room: init.room as string };
}

test('an edit made on one node reaches the other', async () => {
	const id = await item();
	const { first, second, room } = await acrossNodes(id);

	first.collab({ action: 'focus', room, field: 'title' });
	await second.waitFor('focus', (message) => message.field === 'title');

	first.collab({ action: 'update', room, field: 'title', changes: 'Cross Instance' });

	expect(await second.waitFor('update', (message) => message.field === 'title')).toMatchObject({
		room,
		changes: 'Cross Instance',
	});
});

test('leaving on one node is announced on the other', async () => {
	const id = await item();
	const { first, second, room } = await acrossNodes(id);

	second.close();

	expect(await first.waitFor('leave')).toMatchObject({ room });
});

test('a discard on one node reaches the other', async () => {
	const id = await item();
	const { first, second, room } = await acrossNodes(id);

	first.collab({ action: 'focus', room, field: 'title' });
	await second.waitFor('focus', (message) => message.field === 'title');

	first.collab({ action: 'update', room, field: 'title', changes: 'Draft' });
	await second.waitFor('update');

	first.collab({ action: 'discard', room });

	expect(await second.waitFor('discard')).toMatchObject({ room });
});

test('a client joining on one node picks up the state written on the other', async () => {
	const id = await item();
	const { first, second, room } = await acrossNodes(id);

	first.collab({ action: 'focus', room, field: 'title' });
	first.collab({ action: 'update', room, field: 'title', changes: 'Synced' });

	await second.waitFor('update', (message) => message.changes === 'Synced');

	const latecomer = await client(1);

	expect((await latecomer.join(COLLECTION, id)).changes).toMatchObject({ title: 'Synced' });
});

test('turning collaborative editing off closes the rooms on every node', async () => {
	const id = await item();
	const { first, second } = await acrossNodes(id);

	const errors = Promise.all([
		first.waitFor('error', (message) => message.code === 'SERVICE_UNAVAILABLE'),
		second.waitFor('error', (message) => message.code === 'SERVICE_UNAVAILABLE'),
	]);

	await api.request(updateSettings({ collaborative_editing_enabled: false } as any));

	expect(await errors).toHaveLength(2);
});

test('messages relayed between nodes keep a strictly increasing order', async () => {
	const id = await item();
	const { first, second, room } = await acrossNodes(id);

	first.collab({ action: 'focus', room, field: 'title' });
	const focus = await second.waitFor('focus');

	const orders = [focus.order];

	for (const changes of ['U1', 'U2', 'U3']) {
		first.collab({ action: 'update', room, field: 'title', changes });
		orders.push((await second.waitFor('update', (message) => message.changes === changes)).order);
	}

	for (let index = 1; index < orders.length; index++) {
		expect(orders[index]).toBe(orders[index - 1]! + 1);
	}
});

test('deleting the item closes the room on both nodes', async () => {
	const id = await item();
	const { first, second, room } = await acrossNodes(id);

	await api.request(deleteItem(COLLECTION, id));

	expect(await first.waitFor('delete', (message) => message.room === room)).toBeDefined();
	expect(await second.waitFor('delete', (message) => message.room === room)).toBeDefined();
});

test('a write through the API on one node is reported to a room on the other', async () => {
	const id = await item({ title: 'Original' });

	const token = await createRestrictedUser(api, [{ collection: COLLECTION, action: 'read', fields: ['*'] }]);

	const viewer = await client(1, token);
	const init = await viewer.join(COLLECTION, id);

	await api.request(updateItem(COLLECTION, id, { title: 'New' } as any));

	expect(await viewer.waitFor('save', (message) => message.room === init.room)).toBeDefined();
});

test('a version room spans both nodes and reports its save', async () => {
	const id = await item({ title: 'Original' });

	const version = await api.request(
		createContentVersion({ key: randomUUID().replaceAll('-', ''), collection: COLLECTION, item: id } as any),
	);

	const { first, second, room } = await acrossNodes(id, version.id);

	first.collab({ action: 'focus', room, field: 'title' });
	await second.waitFor('focus', (message) => message.field === 'title');

	first.collab({ action: 'update', room, field: 'title', changes: 'Version Update' });

	expect(await second.waitFor('update', (message) => message.changes === 'Version Update')).toMatchObject({ room });

	await api.request(saveToContentVersion(version.id, { title: 'Version Update' } as any));

	expect(await second.waitFor('save')).toBeDefined();
});
