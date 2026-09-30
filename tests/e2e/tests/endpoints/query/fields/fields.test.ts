import { writeFileSync } from 'fs';
import { join } from 'path';
import { SchemaBuilder } from '@directus/schema-builder';
import { createDirectus, createItem, readItem, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { getCallerFolder } from '@utils/getUID.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const schema = new SchemaBuilder({ test_schema: true })
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('users');
		c.field('tags').m2m('tags');
		c.field('links').o2m('links', 'article_id');
		c.field('blocks').m2a(['date_blocks', 'text_blocks']);
	})
	.collection('date_blocks', (c) => {
		c.field('id').id();
		c.field('date').date();
	})
	.collection('text_blocks', (c) => {
		c.field('id').id();
		c.field('text').text();
	})
	.collection('tags', (c) => {
		c.field('id').id();
		c.field('tag').string();
	})
	.collection('users', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('links', (c) => {
		c.field('id').id();
		c.field('link').string();
	});

const snapshot = schema.snapshot();

writeFileSync(join(getCallerFolder(), 'schema.d.ts'), schema.types());

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, snapshot);

test(`select only id`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
			}),
		)
	).id!;

	const result = await api.request(readItem(collections.articles, id, { fields: ['id'] }));

	expect(result).toEqual({
		id: id,
	});
});

test(`select id and title`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
			}),
		)
	).id!;

	const result = await api.request(readItem(collections.articles, id, { fields: ['id', 'title'] }));

	expect(result).toEqual({
		id: id,
		title: 'Article A',
	});
});

test(`select *.*.*`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				tags: [
					{
						tags_id: {
							tag: 'Tag A',
						},
					},
				],
			}),
		)
	).id!;

	const result = await api.request(readItem(collections.articles, id, { fields: ['*.*.*'] }));

	expect(result).toMatchObject({
		id: id,
		title: 'Article A',
		tags: [
			{
				articles_id: {
					id: id,
				},
				id: expect.anything(),
				tags_id: {
					id: expect.anything(),
					tag: 'Tag A',
				},
			},
		],
	});
});

/** `fields` takes both array and comma separated syntax, so these go through the REST endpoint directly. */
async function readRaw(id: string | number, query: string) {
	const response = await fetch(`http://localhost:${port}/items/${collections.articles}/${id}?${query}`, {
		headers: { Authorization: 'Bearer admin' },
	});

	return { status: response.status, body: (await response.json()) as any };
}

test(`no selection returns the same fields as an explicit *`, async () => {
	const { id } = await api.request(createItem(collections.articles, { title: `Article A` }));

	const implicit = await readRaw(id!, '');
	const explicit = await readRaw(id!, 'fields=*');

	expect(implicit.status).toBe(200);
	expect(explicit.status).toBe(200);

	const fields = Object.keys(implicit.body.data).sort();

	expect(Object.keys(explicit.body.data).sort()).toEqual(fields);

	// `*` covers the collection's own fields, but not its relational aliases
	expect(fields).toContain('id');
	expect(fields).toContain('title');
	expect(fields).toContain('author');
});

test(`array syntax within the querystring array limit`, async () => {
	const { id } = await api.request(createItem(collections.articles, { title: `Article A` }));

	const { status, body } = await readRaw(id!, 'fields[]=title');

	expect(status).toBe(200);
	expect(Object.keys(body.data)).toEqual(['title']);
});

test(`array indices beyond the querystring array limit are rejected`, async () => {
	const { id } = await api.request(createItem(collections.articles, { title: `Article A` }));

	// qs parses an array over its limit as an object, which is not a valid `fields` value
	const { status, body } = await readRaw(id!, 'fields[501]=title&fields[502]=title');

	expect(status).toBe(400);
	expect(body.errors[0].extensions.code).toBe('INVALID_QUERY');
});

test(`arrays longer than the querystring array limit are rejected`, async () => {
	const { id } = await api.request(createItem(collections.articles, { title: `Article A` }));

	const { status, body } = await readRaw(id!, Array(502).fill('fields[]=title').join('&'));

	expect(status).toBe(400);
	expect(body.errors[0].extensions.code).toBe('INVALID_QUERY');
});

test(`comma separated syntax bypasses the querystring array limit`, async () => {
	const { id } = await api.request(createItem(collections.articles, { title: `Article A` }));

	const { status, body } = await readRaw(id!, 'fields=' + Array(502).fill('title').join(','));

	expect(status).toBe(200);
	expect(Object.keys(body.data)).toEqual(['title']);
});
