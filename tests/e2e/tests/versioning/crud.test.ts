import { createDirectus, createItem, deleteItem, readItem, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { directusError } from '@utils/errors.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { snapshot } from './snapshot.js';
import { readVersion, useVersions } from './versions.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, snapshot);
const versions = useVersions(api);

const STATE = ['id', 'title', 'directus_version.id', 'directus_version.type'];

test('creates a draft that is not visible live', async () => {
	const draft = await versions.create(collections.posts, { title: 'Draft', directus_version: { name: 'First' } });

	expect(draft).toMatchObject({
		id: null,
		title: 'Draft',
		directus_version: { id: expect.any(Number), name: 'First', type: 'draft' },
	});

	expect(await api.request(readItems(collections.posts, { filter: { title: { _eq: 'Draft' } } }))).toEqual([]);
});

test('returns only the requested fields', async () => {
	const draft = await versions.create(
		collections.posts,
		{ title: 'Fields' },
		{ fields: ['title', 'directus_version.type'] },
	);

	expect(draft).toEqual({ title: 'Fields', directus_version: { type: 'draft' } });
});

test('updates a draft', async () => {
	const draft = await versions.create(collections.posts, { title: 'Before' });

	const updated = await versions.update(collections.posts, draft.directus_version.id, {
		title: 'After',
		views: 5,
		directus_version: { name: 'Renamed' },
	});

	expect(updated).toMatchObject({
		title: 'After',
		views: 5,
		directus_version: { id: draft.directus_version.id, name: 'Renamed', type: 'draft' },
	});

	expect(updated.directus_version.date_updated).not.toBeNull();
});

test('a version of an existing item starts as a copy of it', async () => {
	const live = await api.request(createItem(collections.posts, { title: 'Live', views: 3 }));
	const draft = await versions.create(collections.posts, { id: live.id, title: 'Changed' });

	expect(draft).toMatchObject({ id: live.id, title: 'Changed', views: 3 });
	expect(await api.request(readItem(collections.posts, live.id))).toMatchObject({ title: 'Live', views: 3 });
});

test('publishing creates the live item and later versions update it', async () => {
	const first = await versions.create(collections.posts, { title: 'First publish', views: 1 });
	const published = await versions.publish(collections.posts, first.directus_version.id, {}, { fields: STATE });

	expect(published).toEqual({
		id: expect.any(Number),
		title: 'First publish',
		directus_version: { id: first.directus_version.id, type: 'published' },
	});

	expect(await api.request(readItem(collections.posts, published.id))).toMatchObject({
		title: 'First publish',
		views: 1,
	});

	const second = await versions.create(collections.posts, { id: published.id, title: 'Second publish' });
	await versions.publish(collections.posts, second.directus_version.id);

	expect(await api.request(readItem(collections.posts, published.id))).toMatchObject({
		title: 'Second publish',
		views: 1,
	});

	// The previously published version goes back to being a draft
	expect(await readVersion(api, collections.posts, first.directus_version.id, STATE)).toEqual({
		id: published.id,
		title: 'First publish',
		directus_version: { id: first.directus_version.id, type: 'draft' },
	});
});

test('publishing can delete the published version', async () => {
	const draft = await versions.create(collections.posts, { title: 'Delete after publish' });

	const published = await versions.publish(
		collections.posts,
		draft.directus_version.id,
		{ delete_references: true },
		{ fields: ['id', 'directus_version.id', 'directus_version.type'] },
	);

	expect(published).toEqual({ id: expect.any(Number), directus_version: { id: null, type: 'published' } });
	expect(await api.request(readItem(collections.posts, published.id))).toMatchObject({ title: 'Delete after publish' });
	expect(await readVersion(api, collections.posts, draft.directus_version.id)).toBeUndefined();
});

test('unpublishing removes the live item and keeps the version as draft', async () => {
	const draft = await versions.create(collections.posts, { title: 'Unpublish' });
	const { id } = await versions.publish(collections.posts, draft.directus_version.id);

	const unpublished = await versions.unpublish(collections.posts, draft.directus_version.id, { fields: STATE });

	expect(unpublished).toEqual({
		id: null,
		title: 'Unpublish',
		directus_version: { id: draft.directus_version.id, type: 'draft' },
	});

	await expect(api.request(readItem(collections.posts, id))).rejects.toMatchObject(directusError('FORBIDDEN'));
});

test('unpublishing a draft fails', async () => {
	const draft = await versions.create(collections.posts, { title: 'Not published' });

	await expect(versions.unpublish(collections.posts, draft.directus_version.id)).rejects.toMatchObject(
		directusError('INVALID_PAYLOAD'),
	);
});

test('archiving removes the live item, versions keep its id and publishing restores it', async () => {
	const published = await versions.create(collections.posts, { title: 'Archive' });
	const { id } = await versions.publish(collections.posts, published.directus_version.id);
	const draft = await versions.create(collections.posts, { id, title: 'Archive draft' });

	const archived = await versions.archive(collections.posts, draft.directus_version.id, { fields: STATE });

	// The published version is archived, not the one the request was made for
	expect(archived).toEqual({
		id,
		title: 'Archive',
		directus_version: { id: published.directus_version.id, type: 'archived' },
	});

	expect(await readVersion(api, collections.posts, draft.directus_version.id, STATE)).toEqual({
		id,
		title: 'Archive draft',
		directus_version: { id: draft.directus_version.id, type: 'draft' },
	});

	await expect(api.request(readItem(collections.posts, id))).rejects.toMatchObject(directusError('FORBIDDEN'));

	const restored = await versions.publish(collections.posts, draft.directus_version.id, {}, { fields: ['id'] });

	expect(restored).toEqual({ id });
	expect(await api.request(readItem(collections.posts, id))).toMatchObject({ title: 'Archive draft' });
});

test('reading an item with versions returns the live item or its archived version, never drafts', async () => {
	const draft = await versions.create(collections.posts, { title: 'Read one' });
	const { id } = await versions.publish(collections.posts, draft.directus_version.id);
	await versions.create(collections.posts, { id, title: 'Read one draft' });

	const query = { version: 'true', fields: ['title', 'directus_version.type'] } as any;

	expect(await api.request(readItem(collections.posts, id, query))).toEqual({
		title: 'Read one',
		directus_version: { type: 'published' },
	});

	await versions.archive(collections.posts, draft.directus_version.id);

	expect(await api.request(readItem(collections.posts, id, query))).toEqual({
		title: 'Read one',
		directus_version: { type: 'archived' },
	});

	// An item that only has drafts doesn't exist yet
	const onlyDraft = await versions.create(collections.posts, { id: id + 1000, title: 'Only a draft' });

	await expect(api.request(readItem(collections.posts, onlyDraft.id, query))).rejects.toMatchObject(
		directusError('FORBIDDEN'),
	);
});

test('a version can be created for an item that does not exist yet', async () => {
	const draft = await versions.create(collections.posts, { id: 424242, title: 'Chosen id' });
	const published = await versions.publish(collections.posts, draft.directus_version.id, {}, { fields: ['id'] });

	expect(published).toEqual({ id: 424242 });
	expect(await api.request(readItem(collections.posts, 424242))).toMatchObject({ title: 'Chosen id' });
});

test('deletes a version', async () => {
	const draft = await versions.create(collections.posts, { title: 'Delete me' });

	await versions.delete(collections.posts, draft.directus_version.id);

	expect(await readVersion(api, collections.posts, draft.directus_version.id)).toBeUndefined();
});

test('deleting a live item deletes its versions', async () => {
	const live = await api.request(createItem(collections.posts, { title: 'Delete live' }));
	const draft = await versions.create(collections.posts, { id: live.id, title: 'Delete live draft' });

	await api.request(deleteItem(collections.posts, live.id));

	expect(await readVersion(api, collections.posts, draft.directus_version.id)).toBeUndefined();
});

test('rejects invalid requests', async () => {
	await expect(versions.create(collections.categories, { name: 'Not versioned' })).rejects.toMatchObject(
		directusError('INVALID_PAYLOAD'),
	);

	await expect(versions.create(collections.posts, { nope: 1 })).rejects.toMatchObject(directusError('INVALID_PAYLOAD'));

	await expect(versions.create('directus_shadow_nope', {})).rejects.toMatchObject(directusError('FORBIDDEN'));

	await expect(versions.update(collections.posts, 'abc' as any, {})).rejects.toMatchObject(
		directusError('INVALID_PAYLOAD'),
	);

	await expect(versions.update(collections.posts, 999999, { title: 'Missing' })).rejects.toMatchObject(
		directusError('FORBIDDEN'),
	);
});
