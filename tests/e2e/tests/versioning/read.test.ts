import { aggregate, createDirectus, createItem, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { directusError } from '@utils/errors.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { sortBy } from 'lodash-es';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { snapshot } from './snapshot.js';
import { readWithMeta, useVersions } from './versions.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, snapshot);
const versions = useVersions(api);

const author = await api.request(createItem(collections.authors, { name: 'Live author' }));

// A live item that never had versions
const alpha = await api.request(createItem(collections.posts, { title: 'Alpha', views: 10, author: author.id }));

// A live item that was published from a version
const betaVersion = await versions.create(
	collections.posts,
	{ title: 'Beta', views: 20 },
	{ fields: ['directus_version.id'] },
);

const { id: beta } = await versions.publish(collections.posts, betaVersion.directus_version.id);

// An archived item
const deltaVersion = await versions.create(collections.posts, { title: 'Delta', views: 40 });
const { id: delta } = await versions.publish(collections.posts, deltaVersion.directus_version.id);
await versions.archive(collections.posts, deltaVersion.directus_version.id);

// Drafts: one without an item, one of the Beta item and one referencing a draft author
await versions.create(collections.posts, { title: 'Gamma', views: 30 });
await versions.create(collections.posts, { id: beta, title: 'Beta draft' });
await versions.create(collections.posts, { title: 'Epsilon', views: 50, author: { name: 'Draft author' } });

const read = (query: Record<string, unknown>) =>
	api.request(readItems(collections.posts, { version: 'true', ...query } as any));

test('reading without versions only returns live items', async () => {
	const items = await api.request(readItems(collections.posts, { fields: ['title'], sort: ['title'] }));

	expect(items).toEqual([{ title: 'Alpha' }, { title: 'Beta' }]);
});

test('reading with versions returns live items together with drafts and archived versions', async () => {
	const items = await read({
		fields: ['id', 'title', 'directus_version.type', 'directus_version.id'],
		sort: ['title'],
	});

	expect(items).toEqual([
		{ id: alpha.id, title: 'Alpha', directus_version: { type: 'published', id: null } },
		{ id: beta, title: 'Beta', directus_version: { type: 'published', id: betaVersion.directus_version.id } },
		{ id: beta, title: 'Beta draft', directus_version: { type: 'draft', id: expect.any(Number) } },
		{ id: delta, title: 'Delta', directus_version: { type: 'archived', id: deltaVersion.directus_version.id } },
		{ id: null, title: 'Epsilon', directus_version: { type: 'draft', id: expect.any(Number) } },
		{ id: null, title: 'Gamma', directus_version: { type: 'draft', id: expect.any(Number) } },
	]);
});

test('the wildcard does not include the version meta', async () => {
	const [item] = await read({ fields: ['*'], filter: { title: { _eq: 'Gamma' } } });

	expect(item).not.toHaveProperty('directus_version');
	expect(item).toMatchObject({ id: null, title: 'Gamma', views: 30 });
});

test('filters, sorts and paginates on the version meta', async () => {
	const drafts = { directus_version: { type: { _eq: 'draft' } } };

	expect(await read({ fields: ['title'], filter: drafts, sort: ['-directus_version.id'] })).toEqual([
		{ title: 'Epsilon' },
		{ title: 'Beta draft' },
		{ title: 'Gamma' },
	]);

	expect(await read({ fields: ['title'], filter: drafts, sort: ['-directus_version.id'], limit: 1, page: 2 })).toEqual([
		{ title: 'Beta draft' },
	]);

	expect(
		await read({
			fields: ['title'],
			filter: {
				_or: [{ directus_version: { id: { _null: true } } }, { directus_version: { type: { _eq: 'archived' } } }],
			},
			sort: ['title'],
		}),
	).toEqual([{ title: 'Alpha' }, { title: 'Delta' }]);

	expect(await read({ fields: ['title'], search: 'Gamm' })).toEqual([{ title: 'Gamma' }]);
});

test('rejects unknown version meta', async () => {
	await expect(read({ fields: ['directus_version.nope'] })).rejects.toMatchObject(directusError('INVALID_QUERY'));

	await expect(read({ filter: { directus_version: { nope: { _eq: 1 } } } })).rejects.toMatchObject(
		directusError('INVALID_QUERY'),
	);
});

test('groups and aggregates on the version meta', async () => {
	const grouped = await api.request(
		aggregate(collections.posts, {
			aggregate: { count: '*' },
			groupBy: ['directus_version.type'],
			query: { version: 'true', sort: ['directus_version.type'] },
		} as any),
	);

	expect(grouped.map((row: any) => ({ ...row, count: Number(row.count) }))).toEqual([
		{ directus_version: { type: 'archived' }, count: 1 },
		{ directus_version: { type: 'draft' }, count: 3 },
		{ directus_version: { type: 'published' }, count: 2 },
	]);

	const [totals] = await api.request(
		aggregate(collections.posts, {
			aggregate: { count: 'directus_version.id', sum: 'views' },
			query: { version: 'true', filter: { directus_version: { type: { _neq: 'archived' } } } },
		} as any),
	);

	// Alpha has no version, Beta draft copies the views of Beta
	expect(Number((totals as any).count['directus_version.id'])).toBe(4);
	expect(Number((totals as any).sum.views)).toBe(10 + 20 + 30 + 20 + 50);
});

test('counts versions in the response meta', async () => {
	const result = await readWithMeta('admin', collections.posts, {
		version: 'true',
		meta: '*',
		filter: { directus_version: { type: { _eq: 'draft' } } },
	} as any);

	expect(result.meta).toEqual({ total_count: 6, filter_count: 3 });
	expect(result.data).toHaveLength(3);
});

test('filters on the version meta of related items', async () => {
	expect(
		await read({ fields: ['title'], filter: { author: { directus_version: { type: { _eq: 'draft' } } } } }),
	).toEqual([{ title: 'Epsilon' }]);

	expect(
		await read({ fields: ['title'], filter: { author: { directus_version: { type: { _eq: 'published' } } } } }),
	).toEqual([{ title: 'Alpha' }]);

	// Nested filters also apply to referenced versions of related items
	expect(await read({ fields: ['title'], filter: { author: { name: { _eq: 'Draft author' } } } })).toEqual([
		{ title: 'Epsilon' },
	]);
});

test('selects the version meta of related items', async () => {
	const items = await read({
		fields: ['title', 'author.name', 'author.directus_version.type'],
		filter: { author: { _nnull: true } },
		sort: ['title'],
	});

	expect(items).toEqual([{ title: 'Alpha', author: { name: 'Live author', directus_version: { type: 'published' } } }]);

	const [epsilon] = await read({
		fields: ['title', 'author.name', 'author.directus_version.type'],
		filter: { title: { _eq: 'Epsilon' } },
	});

	expect(epsilon).toEqual({ title: 'Epsilon', author: { name: 'Draft author', directus_version: { type: 'draft' } } });
});

test('reads the related items of versions', async () => {
	const note = await api.request(createItem(collections.notes, { text: 'Live note' }));

	const draft = await versions.create(collections.posts, {
		title: 'With notes',
		notes: [note.id, { text: 'Draft note' }],
	});

	const [item] = await read({
		fields: ['notes.text', 'notes.directus_version.type'],
		filter: { directus_version: { id: { _eq: draft.directus_version.id } } },
	});

	expect(sortBy(item!['notes'], 'text')).toEqual([
		{ text: 'Draft note', directus_version: { type: 'draft' } },
		{ text: 'Live note', directus_version: { type: 'published' } },
	]);

	await versions.delete(collections.posts, draft.directus_version.id);
});
