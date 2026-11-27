import { createDirectus, createItem, readItem, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { directusError } from '@utils/errors.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { sortBy } from 'lodash-es';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { snapshot } from './snapshot.js';
import { readVersion, useVersions } from './versions.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, snapshot);
const versions = useVersions(api);

const category = await api.request(createItem(collections.categories, { name: 'Live category' }));
const author = await api.request(createItem(collections.authors, { name: 'Live author' }));
const tag = await api.request(createItem(collections.tags, { name: 'Live tag' }));
const text = await api.request(createItem(collections.text, { content: 'Live text' }));
const image = await api.request(createItem(collections.images, { url: 'live.png' }));
await api.request(createItem(collections.languages, { code: 'en-US', name: 'English' }));
await api.request(createItem(collections.languages, { code: 'de-DE', name: 'German' }));

async function publish(versionId: number) {
	const { id } = await versions.publish(collections.posts, versionId, {}, { fields: ['id'] });
	return id as number;
}

test('m2o to an unversioned collection only links live items', async () => {
	const draft = await versions.create(collections.posts, { title: 'm2o live', category: category.id });

	expect(await readVersion(api, collections.posts, draft.directus_version.id, ['category.name'])).toEqual({
		category: { name: 'Live category' },
	});

	await expect(versions.create(collections.posts, { category: { name: 'New category' } })).rejects.toMatchObject(
		directusError('INVALID_PAYLOAD'),
	);

	const id = await publish(draft.directus_version.id);

	expect(await api.request(readItem(collections.posts, id, { fields: ['category'] }))).toEqual({
		category: category.id,
	});
});

test('m2o to a versioned collection links live items and versions', async () => {
	const linked = await versions.create(collections.posts, { title: 'm2o linked', author: author.id });

	expect(
		await readVersion(api, collections.posts, linked.directus_version.id, [
			'author.name',
			'author.directus_version.type',
		]),
	).toEqual({ author: { name: 'Live author', directus_version: { type: 'published' } } });

	const nested = await versions.create(collections.posts, { title: 'm2o nested', author: { name: 'Draft author' } });

	const { author: authorVersion } = (await readVersion(api, collections.posts, nested.directus_version.id, [
		'author.name',
		'author.directus_version.id',
		'author.directus_version.type',
	]))!;

	expect(authorVersion).toEqual({ name: 'Draft author', directus_version: { id: expect.any(Number), type: 'draft' } });

	// Requesting only the key returns the reference to the version
	expect(await readVersion(api, collections.posts, nested.directus_version.id, ['author'])).toEqual({
		author: { directus_version: { id: authorVersion.directus_version.id } },
	});

	// Other versions can reference an existing version of the related item
	const shared = await versions.create(collections.posts, {
		title: 'm2o shared',
		author: { directus_version: { id: authorVersion.directus_version.id } },
	});

	expect(await readVersion(api, collections.posts, shared.directus_version.id, ['author.name'])).toEqual({
		author: { name: 'Draft author' },
	});

	// Publishing publishes the referenced version as well
	const id = await publish(nested.directus_version.id);
	const live: any = await api.request(readItem(collections.posts, id, { fields: ['author.id', 'author.name'] } as any));

	expect(live.author).toEqual({ id: expect.any(Number), name: 'Draft author' });
	expect(await api.request(readItem(collections.authors, live.author.id))).toMatchObject({ name: 'Draft author' });

	expect(
		await readVersion(api, collections.posts, shared.directus_version.id, [
			'author.name',
			'author.directus_version.type',
		]),
	).toEqual({ author: { name: 'Draft author', directus_version: { type: 'published' } } });
});

test('self-referencing m2o publishes the referenced version first', async () => {
	const child = await versions.create(collections.posts, { title: 'Child', parent: { title: 'Parent' } });

	expect(await readVersion(api, collections.posts, child.directus_version.id, ['title', 'parent.title'])).toEqual({
		title: 'Child',
		parent: { title: 'Parent' },
	});

	const id = await publish(child.directus_version.id);

	expect(await api.request(readItem(collections.posts, id, { fields: ['title', 'parent.title'] } as any))).toEqual({
		title: 'Child',
		parent: { title: 'Parent' },
	});
});

test('o2m to an unversioned collection links live items through the link table', async () => {
	const first = await api.request(createItem(collections.links, { url: 'first.com' }));
	const second = await api.request(createItem(collections.links, { url: 'second.com' }));

	const draft = await versions.create(collections.posts, { title: 'o2m live', links: [first.id] });
	const versionId = draft.directus_version.id;

	expect(await readVersion(api, collections.posts, versionId, ['links.url'])).toEqual({
		links: [{ url: 'first.com' }],
	});

	await versions.update(collections.posts, versionId, { links: { update: [{ id: second.id }], delete: [first.id] } });

	expect(await readVersion(api, collections.posts, versionId, ['links'])).toEqual({ links: [second.id] });

	await expect(
		versions.update(collections.posts, versionId, { links: { create: [{ url: 'new.com' }] } }),
	).rejects.toMatchObject(directusError('INVALID_PAYLOAD'));

	// Linking a version doesn't change the live items
	expect(await api.request(readItem(collections.links, second.id))).toMatchObject({ post_id: null });

	const id = await publish(versionId);

	expect(await api.request(readItem(collections.links, second.id))).toMatchObject({ post_id: id });
	expect(await api.request(readItem(collections.links, first.id))).toMatchObject({ post_id: null });
});

test('o2m to a versioned collection creates, updates and removes related versions', async () => {
	const liveNote = await api.request(createItem(collections.notes, { text: 'Live note' }));

	const draft = await versions.create(collections.posts, {
		title: 'o2m versioned',
		notes: [{ text: 'First' }, { text: 'Second' }],
	});

	const versionId = draft.directus_version.id;
	const fields = ['notes.text', 'notes.directus_version.id', 'notes.directus_version.type'];
	const { notes } = (await readVersion(api, collections.posts, versionId, fields))!;

	expect(notes).toEqual([
		{ text: 'First', directus_version: { id: expect.any(Number), type: 'draft' } },
		{ text: 'Second', directus_version: { id: expect.any(Number), type: 'draft' } },
	]);

	await versions.update(collections.posts, versionId, {
		notes: {
			create: [{ text: 'Third' }],
			update: [{ text: 'First edited', directus_version: { id: notes[0].directus_version.id } }, liveNote.id],
			delete: [{ directus_version: { id: notes[1].directus_version.id } }],
		},
	});

	const updated = await readVersion(api, collections.posts, versionId, ['notes.text']);

	expect(sortBy(updated!['notes'], 'text')).toEqual([
		{ text: 'First edited' },
		{ text: 'Live note' },
		{ text: 'Third' },
	]);

	const id = await publish(versionId);

	const live = await api.request(readItems(collections.notes, { filter: { post_id: { _eq: id } }, fields: ['text'] }));

	expect(sortBy(live, 'text')).toEqual([{ text: 'First edited' }, { text: 'Live note' }, { text: 'Third' }]);
});

test('m2m links live items and creates versions of related items', async () => {
	const draft = await versions.create(collections.posts, {
		title: 'm2m',
		tags: [{ tags_id: tag.id }, { tags_id: { name: 'Draft tag' } }],
	});

	const fields = ['tags.tags_id.name', 'tags.tags_id.directus_version.type'];
	const version = await readVersion(api, collections.posts, draft.directus_version.id, fields);

	expect(sortBy(version!['tags'], 'tags_id.name')).toEqual([
		{ tags_id: { name: 'Draft tag', directus_version: { type: 'draft' } } },
		{ tags_id: { name: 'Live tag', directus_version: { type: 'published' } } },
	]);

	const id = await publish(draft.directus_version.id);
	const live: any = await api.request(readItem(collections.posts, id, { fields: ['tags.tags_id.name'] } as any));

	expect(sortBy(live.tags, 'tags_id.name')).toEqual([
		{ tags_id: { name: 'Draft tag' } },
		{ tags_id: { name: 'Live tag' } },
	]);
});

test('m2a links live items and creates versions of related items', async () => {
	const draft = await versions.create(collections.posts, {
		title: 'm2a',
		blocks: [
			{ collection: collections.text, item: text.id },
			{ collection: collections.images, item: image.id },
			{ collection: collections.text, item: { content: 'Draft text' } },
		],
	});

	const version = await readVersion(api, collections.posts, draft.directus_version.id, [
		'blocks.collection',
		'blocks.item',
	]);

	expect(version!['blocks']).toEqual(
		expect.arrayContaining([
			{ collection: collections.text, item: String(text.id) },
			{ collection: collections.images, item: String(image.id) },
			{ collection: collections.text, item: { directus_version: { id: expect.any(Number) } } },
		]),
	);

	const id = await publish(draft.directus_version.id);

	const live: any = await api.request(
		readItem(collections.posts, id, {
			fields: ['blocks.collection', `blocks.item:${collections.text}.content`, `blocks.item:${collections.images}.url`],
		} as any),
	);

	expect(live.blocks).toEqual(
		expect.arrayContaining([
			{ collection: collections.text, item: { content: 'Live text' } },
			{ collection: collections.images, item: { url: 'live.png' } },
			{ collection: collections.text, item: { content: 'Draft text' } },
		]),
	);
});

test('a2o links live items and creates versions of related items', async () => {
	const linked = await versions.create(collections.posts, {
		title: 'a2o linked',
		collection: collections.images,
		attachment: image.id,
	});

	expect(await readVersion(api, collections.posts, linked.directus_version.id, ['collection', 'attachment'])).toEqual({
		collection: collections.images,
		attachment: String(image.id),
	});

	const nested = await versions.create(collections.posts, {
		title: 'a2o nested',
		collection: collections.text,
		attachment: { content: 'Attached text' },
	});

	expect(await readVersion(api, collections.posts, nested.directus_version.id, ['attachment'])).toEqual({
		attachment: { directus_version: { id: expect.any(Number) } },
	});

	// Images aren't versioned, so only links to live images are possible
	await expect(
		versions.create(collections.posts, { collection: collections.images, attachment: { url: 'new.png' } }),
	).rejects.toMatchObject(directusError('INVALID_PAYLOAD'));

	const id = await publish(nested.directus_version.id);
	const live: any = await api.request(readItem(collections.posts, id, { fields: ['collection', 'attachment'] }));

	expect(live.collection).toBe(collections.text);
	expect(await api.request(readItem(collections.text, live.attachment))).toMatchObject({ content: 'Attached text' });
});

test('translations are versioned with the item', async () => {
	const draft = await versions.create(collections.posts, {
		title: 'translations',
		translations: [
			{ languages_code: 'en-US', title: 'Hello' },
			{ languages_code: 'de-DE', title: 'Hallo' },
		],
	});

	const fields = ['translations.languages_code', 'translations.title'];
	const version = await readVersion(api, collections.posts, draft.directus_version.id, fields);

	expect(sortBy(version!['translations'], 'languages_code')).toEqual([
		{ languages_code: 'de-DE', title: 'Hallo' },
		{ languages_code: 'en-US', title: 'Hello' },
	]);

	// Updating a translation of the draft
	const [english] = (await readVersion(api, collections.posts, draft.directus_version.id, [
		'translations.languages_code',
		'translations.directus_version.id',
	]))!['translations'].filter((translation: any) => translation.languages_code === 'en-US');

	await versions.update(collections.posts, draft.directus_version.id, {
		translations: { update: [{ title: 'Hello there', directus_version: { id: english.directus_version.id } }] },
	});

	const id = await publish(draft.directus_version.id);
	const live: any = await api.request(readItem(collections.posts, id, { fields } as any));

	expect(sortBy(live.translations, 'languages_code')).toEqual([
		{ languages_code: 'de-DE', title: 'Hallo' },
		{ languages_code: 'en-US', title: 'Hello there' },
	]);
});
