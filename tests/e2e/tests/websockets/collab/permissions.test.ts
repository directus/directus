import { randomUUID } from 'node:crypto';
import { createDirectus, createItem, rest, staticToken, updateSettings, updateSingleton } from '@directus/sdk';
import { openCollab } from '@utils/collab.js';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { afterAll, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { createRestrictedUser, type Rule } from './users.js';

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

async function restricted(permissions: Rule[]) {
	return client(await createRestrictedUser(api as any, permissions));
}

test('joining an item the user cannot read is refused', async () => {
	const item = await api.request(createItem(collections.private, { secret: 'Hidden' } as any));

	const collab = await restricted([]);

	expect(await collab.join(collections.private, item.id!)).toMatchObject({
		action: 'error',
		code: 'FORBIDDEN',
	});
});

test('an update to a field the user cannot read is not broadcast to them', async () => {
	const item = await api.request(
		createItem(collections.items, { title: 'Public Title', content: 'Secret Content' } as any),
	);

	const admin = await client();

	const viewer = await restricted([
		{ collection: collections.items, action: 'read', fields: ['id', 'title'] },
		{ collection: collections.items, action: 'update', fields: ['id', 'title'] },
	]);

	const init = await admin.join(collections.items, item.id!);
	await viewer.join(collections.items, item.id!);
	await admin.waitFor('join');

	const room = init.room;

	admin.collab({ action: 'focus', room, field: 'title' });
	await viewer.waitFor('focus', (message) => message.field === 'title');

	admin.collab({ action: 'update', room, field: 'title', changes: 'New Public Title' });

	expect(await viewer.waitFor('update', (message) => message.field === 'title')).toMatchObject({
		changes: 'New Public Title',
	});

	admin.collab({ action: 'focus', room, field: 'content' });
	admin.collab({ action: 'update', room, field: 'content', changes: 'New Secret Content' });

	// Nothing about `content` ever reaches a client that may not read it
	expect(await viewer.quiet('update', (message) => message.field === 'content')).toBe(true);
	expect(await viewer.quiet('focus', (message) => message.field === 'content')).toBe(true);
});

test('clearing a field only propagates when the recipient may read it', async () => {
	const item = await api.request(
		createItem(collections.items, { title: 'Public Title', content: 'Secret Content' } as any),
	);

	const admin = await client();

	const viewer = await restricted([
		{ collection: collections.items, action: 'read', fields: ['id', 'title'] },
		{ collection: collections.items, action: 'update', fields: ['id', 'title'] },
	]);

	const init = await admin.join(collections.items, item.id!);
	await viewer.join(collections.items, item.id!);
	await admin.waitFor('join');

	const room = init.room;

	admin.collab({ action: 'update', room, field: 'content', changes: null });

	expect(await viewer.quiet('update')).toBe(true);

	admin.collab({ action: 'update', room, field: 'title', changes: null });

	// Clearing a readable field reaches the viewer, together with the focus it implies
	const focus = await viewer.waitFor('focus', (message) => message.field === 'title');
	const update = await viewer.waitFor('update', (message) => message.field === 'title');

	expect(focus).toMatchObject({ room, field: 'title' });
	expect(update).toMatchObject({ room, field: 'title', changes: null });
});

test('initial changes touching a field the user cannot update are refused', async () => {
	const item = await api.request(
		createItem(collections.items, { title: 'Original Title', content: 'Original Content' } as any),
	);

	const collab = await restricted([
		{ collection: collections.items, action: 'read', fields: ['*'] },
		{ collection: collections.items, action: 'update', fields: ['id', 'title'] },
	]);

	collab.collab({
		action: 'join',
		collection: collections.items,
		item: item.id,
		version: null,
		initialChanges: { title: 'New Title', content: 'Invalid' },
	});

	expect(await collab.waitFor('error')).toMatchObject({
		code: 'FORBIDDEN',
		message: expect.stringMatching(/No permission to update field content or field does not exist/i),
	});
});

test('an update to a field the user cannot update is refused', async () => {
	const item = await api.request(
		createItem(collections.items, { title: 'Original Title', content: 'Original Content' } as any),
	);

	const collab = await restricted([
		{ collection: collections.items, action: 'read', fields: ['*'] },
		{ collection: collections.items, action: 'update', fields: ['id', 'title'] },
	]);

	const init = await collab.join(collections.items, item.id!);

	collab.collab({ action: 'update', room: init.room, field: 'content', changes: 'Unauthorized Update' });

	expect(await collab.waitFor('error')).toMatchObject({
		code: 'FORBIDDEN',
		message: expect.stringMatching(/No permission to update field content or field does not exist/i),
	});
});

test('a field that does not exist is refused, on join and on update', async () => {
	const item = await api.request(createItem(collections.items, { title: 'Original' } as any));

	const permissions: Rule[] = [
		{ collection: collections.items, action: 'read', fields: ['*'] },
		{ collection: collections.items, action: 'update', fields: ['*'] },
	];

	const token = await createRestrictedUser(api as any, permissions);

	const joiner = await client(token);

	joiner.collab({
		action: 'join',
		collection: collections.items,
		item: item.id,
		version: null,
		initialChanges: { non_existent: 'Invalid' },
	});

	expect(await joiner.waitFor('error')).toMatchObject({
		code: 'FORBIDDEN',
		message: expect.stringMatching(/No permission to update field non_existent or field does not exist/i),
	});

	const updater = await client(token);
	const init = await updater.join(collections.items, item.id!);

	updater.collab({ action: 'update', room: init.room, field: 'unknown_field', changes: 'Value' });

	expect(await updater.waitFor('error')).toMatchObject({
		code: 'FORBIDDEN',
		message: expect.stringMatching(/No permission to update field unknown_field or field does not exist/i),
	});
});

test('a discard only names the fields each recipient may read', async () => {
	const item = await api.request(createItem(collections.items, { title: 'Original', content: 'Original' } as any));

	const viewer = await restricted([
		{ collection: collections.items, action: 'read', fields: ['id', 'title', 'content'] },
		{ collection: collections.items, action: 'update', fields: ['id', 'title'] },
	]);

	const init = await viewer.join(collections.items, item.id!);
	const room = init.room;

	const admin = await client();
	await admin.join(collections.items, item.id!);
	await viewer.waitFor('join');

	viewer.collab({ action: 'update', room, field: 'title', changes: 'Dirty Title' });
	admin.collab({ action: 'update', room, field: 'content', changes: 'Admin Content' });

	await admin.waitFor('update', (message) => message.field === 'title');
	await viewer.waitFor('update', (message) => message.field === 'content');

	viewer.collab({ action: 'discard', room });

	// The restricted client may only discard what it is allowed to change
	for (const collab of [viewer, admin]) {
		const discard = await collab.waitFor('discard');

		expect(discard.fields).toContain('title');
		expect(discard.fields).not.toContain('content');
	}
});

test('a relational draft is trimmed to the fields the recipient may read', async () => {
	const main = await api.request(createItem(collections.relational, { name: 'Main Item' } as any));

	const admin = await client();

	const viewer = await restricted([
		{ collection: collections.relational, action: 'read', fields: ['*'] },
		{ collection: collections.relational, action: 'update', fields: ['*'] },
		{ collection: collections.m2o, action: 'read', fields: ['id', 'field_a'] },
	]);

	const init = await admin.join(collections.relational, main.id!);
	await viewer.join(collections.relational, main.id!);

	const ghost = randomUUID();

	admin.collab({
		action: 'update',
		room: init.room,
		field: 'm2o_related',
		changes: { id: ghost, field_a: 'Public Value', field_b: 'SENSITIVE GHOST DATA' },
	});

	const update = await viewer.waitFor('update', (message) => message.field === 'm2o_related');

	expect(update.changes).toMatchObject({ id: ghost, field_a: 'Public Value' });
	expect(update.changes).not.toHaveProperty('field_b');
});

test('a singleton room hands a restricted client only the fields it may read', async () => {
	await api.request(updateSingleton(collections.singleton, { confidential: 'Initial' } as any));

	const admin = await client();
	const init = await admin.join(collections.singleton, null as any);

	admin.collab({
		action: 'update',
		room: init.room,
		field: 'confidential',
		changes: 'SENSITIVE SINGLETON GHOST DATA',
	});

	const viewer = await restricted([{ collection: collections.singleton, action: 'read', fields: ['id'] }]);

	const joined = await viewer.join(collections.singleton, null as any);

	expect(joined.action).toBe('init');
	expect(joined.changes ?? {}).not.toHaveProperty('confidential');
});
