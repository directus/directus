import { randomUUID } from 'node:crypto';
import {
	createCollection,
	createContentVersion,
	createDirectus,
	createItem,
	deleteItem,
	rest,
	saveToContentVersion,
	staticToken,
	updateSettings,
} from '@directus/sdk';
import { openCollab } from '@utils/collab.js';
import { port } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, expect, test } from 'vitest';

const api = createDirectus<any>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

const COLLECTION = `${getUID()}_items`;

await api.request(updateSettings({ collaborative_editing_enabled: true } as any));

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
			{ field: 'content', type: 'text' },
			{ field: 'notes', type: 'text' },
		],
		schema: {},
		meta: { singleton: false, versioning: true },
	} as any),
);

const clients: { close: () => void }[] = [];

afterAll(() => {
	for (const client of clients) client.close();
});

/** Opens a collab client that is closed again once the file is done. */
async function client() {
	const collab = await openCollab(port);
	clients.push(collab);
	return collab;
}

/** Creates an item and returns its id. */
async function item(values: Record<string, unknown> = {}) {
	const created = await api.request(createItem(COLLECTION, { title: 'Item', ...values } as any));
	return created.id as string;
}

/** Two clients in the same room, with the first one's init already settled. */
async function twoInARoom(id: string, version: string | null = null) {
	const first = await client();
	const init = await first.join(COLLECTION, id, version);

	const second = await client();
	await second.join(COLLECTION, id, version);

	// The first client learns about the second before anything else happens
	await first.waitFor('join');

	return { first, second, room: init.room as string, init };
}

test('a client can join a room and leave it again', async () => {
	const id = await item();
	const collab = await client();

	const init = await collab.join(COLLECTION, id);

	expect(init).toMatchObject({ type: 'collab', action: 'init', collection: COLLECTION, item: id });

	collab.collab({ action: 'leave', room: init.room });
});

test('joining with an unknown version is refused', async () => {
	const id = await item();
	const collab = await client();

	expect(await collab.join(COLLECTION, id, 'invalid-version-string')).toMatchObject({
		action: 'error',
		code: 'FORBIDDEN',
	});
});

test('joining an unknown collection is refused', async () => {
	const collab = await client();

	expect(await collab.join('no_such_collection', randomUUID())).toMatchObject({
		action: 'error',
		code: 'FORBIDDEN',
	});
});

test('leaving a room is announced to whoever stays', async () => {
	const id = await item();
	const { first, second, room } = await twoInARoom(id);

	second.close();

	const leave = await first.waitFor('leave');

	expect(leave).toMatchObject({ type: 'collab', action: 'leave', room });
});

test('focusing a field is announced to the other clients', async () => {
	const id = await item();
	const { first, second, room, init } = await twoInARoom(id);

	first.collab({ action: 'focus', room, field: 'title' });

	expect(await second.waitFor('focus', (message) => message.field === 'title')).toMatchObject({
		room,
		field: 'title',
		connection: init.connection,
	});
});

test('a field that is already focused cannot be taken over', async () => {
	const id = await item();
	const { first, second, room } = await twoInARoom(id);

	first.collab({ action: 'focus', room, field: 'title' });
	await second.waitFor('focus', (message) => message.field === 'title');

	second.collab({ action: 'focus', room, field: 'title' });

	expect(await second.waitFor('error')).toMatchObject({
		code: 'FORBIDDEN',
		message: expect.stringContaining('already focused'),
	});
});

test('exactly one client wins a race for the same field', async () => {
	const id = await item();
	const { first, second, room } = await twoInARoom(id);

	first.collab({ action: 'focus', room, field: 'title' });
	second.collab({ action: 'focus', room, field: 'title' });

	const errors = (
		await Promise.all([
			first.waitFor('error', undefined, 5000).catch(() => null),
			second.waitFor('error', undefined, 5000).catch(() => null),
		])
	).filter(Boolean);

	expect(errors).toHaveLength(1);
	expect(errors[0]).toMatchObject({ code: 'FORBIDDEN', message: expect.stringContaining('already focused') });
});

test('releasing a focus lets another client take the field', async () => {
	const id = await item();
	const { first, second, room, init } = await twoInARoom(id);

	first.collab({ action: 'focus', room, field: 'title' });
	await second.waitFor('focus', (message) => message.field === 'title');

	first.collab({ action: 'focus', room, field: null });
	await second.waitFor('focus', (message) => message.field === null);

	second.collab({ action: 'focus', room, field: 'title' });

	expect(
		await first.waitFor('focus', (message) => message.field === 'title' && message.connection !== init.connection),
	).toBeDefined();
});

test('a focus is released when the client leaves the room', async () => {
	const id = await item();

	// An observer stays in the room, so the leave can be waited for rather than guessed at
	const observer = await client();
	await observer.join(COLLECTION, id);

	const first = await client();
	const init = await first.join(COLLECTION, id);

	first.collab({ action: 'focus', room: init.room, field: 'title' });
	await observer.waitFor('focus', (message) => message.field === 'title');

	first.collab({ action: 'leave', room: init.room });
	await observer.waitFor('leave');

	const second = await client();
	const rejoined = await second.join(COLLECTION, id);

	expect(rejoined.focuses).toEqual({});

	second.collab({ action: 'focus', room: rejoined.room, field: 'title' });

	expect(await second.quiet('error')).toBe(true);
});

test('an update is broadcast to the other clients in the room', async () => {
	const id = await item();
	const { first, second, room } = await twoInARoom(id);

	first.collab({ action: 'focus', room, field: 'title' });
	await second.waitFor('focus', (message) => message.field === 'title');

	first.collab({ action: 'update', room, field: 'title', changes: 'Updated Title' });

	expect(await second.waitFor('update', (message) => message.field === 'title')).toMatchObject({
		room,
		field: 'title',
		changes: 'Updated Title',
	});
});

test('deleting the item is broadcast to the room', async () => {
	const id = await item();
	const collab = await client();

	await collab.join(COLLECTION, id);

	await api.request(deleteItem(COLLECTION, id));

	expect(await collab.waitFor('delete')).toMatchObject({ type: 'collab', action: 'delete' });
});

test('a client that joins later receives the changes it missed', async () => {
	const id = await item({ title: 'V1' });
	const { first, second, room } = await twoInARoom(id);

	// An observer tells us when the change has actually landed in the shared room state
	const observer = await client();
	await observer.join(COLLECTION, id);

	first.close();

	second.collab({ action: 'focus', room, field: 'title' });
	second.collab({ action: 'update', room, field: 'title', changes: 'V2' });

	await observer.waitFor('update', (message) => message.changes === 'V2');

	const latecomer = await client();
	const init = await latecomer.join(COLLECTION, id);

	expect(init.changes).toMatchObject({ title: 'V2' });
});

test('edits to different fields are merged rather than overwriting each other', async () => {
	const id = await item({ title: 'Main', notes: 'Main' });
	const { first, second, room } = await twoInARoom(id);

	first.collab({ action: 'focus', room, field: 'title' });
	second.collab({ action: 'focus', room, field: 'notes' });

	await first.waitFor('focus', (message) => message.field === 'notes');
	await second.waitFor('focus', (message) => message.field === 'title');

	first.collab({ action: 'update', room, field: 'title', changes: 'Merged Title' });
	second.collab({ action: 'update', room, field: 'notes', changes: 'Merged Notes' });

	await first.waitFor('update', (message) => message.field === 'notes');
	await second.waitFor('update', (message) => message.field === 'title');

	const latecomer = await client();
	const init = await latecomer.join(COLLECTION, id);

	expect(init.changes).toMatchObject({ title: 'Merged Title', notes: 'Merged Notes' });
});

test('the last write to a field wins', async () => {
	const id = await item({ title: 'Original' });
	const { first, second, room } = await twoInARoom(id);

	first.collab({ action: 'focus', room, field: 'title' });
	await second.waitFor('focus', (message) => message.field === 'title');

	first.collab({ action: 'update', room, field: 'title', changes: 'Val A' });
	await second.waitFor('update', (message) => message.changes === 'Val A');

	first.collab({ action: 'focus', room, field: null });
	await second.waitFor('focus', (message) => message.field === null);

	second.collab({ action: 'focus', room, field: 'title' });
	second.collab({ action: 'update', room, field: 'title', changes: 'Val B' });

	await first.waitFor('update', (message) => message.changes === 'Val B');

	const latecomer = await client();
	const init = await latecomer.join(COLLECTION, id);

	expect(init.changes).toMatchObject({ title: 'Val B' });
});

test('rooms for different items do not see each other', async () => {
	const [firstId, secondId] = [await item({ title: 'Item 1' }), await item({ title: 'Item 2' })];

	const first = await client();
	const second = await client();

	const firstInit = await first.join(COLLECTION, firstId);
	const secondInit = await second.join(COLLECTION, secondId);

	expect(firstInit.room).not.toBe(secondInit.room);

	// Observers tell us when each change has landed in its room's shared state
	const firstObserver = await client();
	const secondObserver = await client();

	await firstObserver.join(COLLECTION, firstId);
	await secondObserver.join(COLLECTION, secondId);

	first.collab({ action: 'focus', room: firstInit.room, field: 'title' });
	second.collab({ action: 'focus', room: secondInit.room, field: 'title' });

	first.collab({ action: 'update', room: firstInit.room, field: 'title', changes: 'Update 1' });
	second.collab({ action: 'update', room: secondInit.room, field: 'title', changes: 'Update 2' });

	await firstObserver.waitFor('update', (message) => message.changes === 'Update 1');
	await secondObserver.waitFor('update', (message) => message.changes === 'Update 2');

	const firstLatecomer = await client();
	const secondLatecomer = await client();

	// Each room only carries its own change
	expect((await firstLatecomer.join(COLLECTION, firstId)).changes).toMatchObject({ title: 'Update 1' });
	expect((await secondLatecomer.join(COLLECTION, secondId)).changes).toMatchObject({ title: 'Update 2' });
});

test('a room scoped to a version reports when that version is saved', async () => {
	const id = await item({ title: 'Original' });

	const version = await api.request(
		createContentVersion({ key: randomUUID().replaceAll('-', ''), collection: COLLECTION, item: id } as any),
	);

	const { first, second, room } = await twoInARoom(id, version.id);

	first.collab({ action: 'focus', room, field: 'title' });
	first.collab({ action: 'update', room, field: 'title', changes: 'Version Update' });

	await second.waitFor('update', (message) => message.changes === 'Version Update');

	await api.request(saveToContentVersion(version.id, { title: 'Version Update' } as any));

	expect(await first.waitFor('save')).toBeDefined();
	expect(await second.waitFor('save')).toBeDefined();
});

test('discarding and unsetting a field keep the focus, releasing it does not', async () => {
	const id = await item();
	const { first, second, room, init } = await twoInARoom(id);

	first.collab({ action: 'focus', room, field: 'title' });
	await second.waitFor('focus', (message) => message.field === 'title');

	// Discarding the draft does not hand the field back
	first.collab({ action: 'discard', room });
	await second.waitFor('discard');

	second.collab({ action: 'focus', room, field: 'title' });
	expect(await second.waitFor('error', (message) => message.code === 'FORBIDDEN')).toBeDefined();

	// Neither does clearing the value
	first.collab({ action: 'update', room, field: 'title', changes: 'Draft' });
	await second.waitFor('update');

	first.collab({ action: 'update', room, field: 'title' });
	await second.waitFor('discard');

	second.collab({ action: 'focus', room, field: 'title' });
	expect(await second.waitFor('error', (message) => message.code === 'FORBIDDEN')).toBeDefined();

	// Releasing it explicitly does
	first.collab({ action: 'focus', room, field: null });
	await second.waitFor('focus', (message) => message.field === null);

	second.collab({ action: 'focus', room, field: 'title' });

	expect(
		await first.waitFor('focus', (message) => message.field === 'title' && message.connection !== init.connection),
	).toBeDefined();
});
