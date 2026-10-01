import { createDirectus, rest, staticToken, updateSettings, updateSingleton } from '@directus/sdk';
import { openCollab } from '@utils/collab.js';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { afterAll, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { createRestrictedUser } from './users.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

await api.request(updateSettings({ collaborative_editing_enabled: true } as any));

const { collections } = await useSnapshot<Schema>(api);

const clients: { close: () => void }[] = [];

afterAll(() => {
	for (const client of clients) client.close();
});

async function client(token = 'admin') {
	const collab = await openCollab(port, token);
	clients.push(collab);
	return collab;
}

test('a singleton room is joined without an item id and broadcasts edits', async () => {
	await api.request(updateSingleton(collections.singleton, { title: 'Singleton Item', is_published: true } as any));

	const admin = await client();

	// An item scoped rule, so the room also has to resolve the singleton's row to check access
	const viewer = await client(
		await createRestrictedUser(api as any, [
			{ collection: collections.singleton, action: 'read', fields: ['*'] },
			{ collection: collections.singleton, action: 'update', fields: ['title'] },
		]),
	);

	const init = await admin.join(collections.singleton, null as any);
	await viewer.join(collections.singleton, null as any);
	await admin.waitFor('join');

	const room = init.room;

	admin.collab({ action: 'focus', room, field: 'title' });
	await viewer.waitFor('focus', (message) => message.field === 'title');

	admin.collab({ action: 'update', room, field: 'title', changes: 'New Value' });

	expect(await viewer.waitFor('update', (message) => message.field === 'title')).toMatchObject({
		room,
		field: 'title',
		changes: 'New Value',
	});
});

test('an external write to the singleton is reported to the room', async () => {
	await api.request(
		updateSingleton(collections.singleton, { title: 'Singleton External Test', is_published: true } as any),
	);

	const viewer = await client(
		await createRestrictedUser(api as any, [{ collection: collections.singleton, action: 'read', fields: ['*'] }]),
	);

	const init = await viewer.join(collections.singleton, null as any);

	await api.request(updateSingleton(collections.singleton, { title: 'Updated Externally' } as any));

	expect(await viewer.waitFor('save')).toMatchObject({ type: 'collab', action: 'save', room: init.room });
});
