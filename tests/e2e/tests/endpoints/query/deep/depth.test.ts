import { createDirectus, createItem, graphql, readItems, rest, staticToken } from '@directus/sdk';
import { env, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

const MAX_DEPTH = Number(env['MAX_RELATIONAL_DEPTH']);

const MESSAGE = 'Invalid query. Max relational depth exceeded.';

/**
 * `articles.tags` is a m2m whose junction points back at `articles`, so alternating the two
 * field names walks a relational path of any length.
 */
function path(segments: number) {
	return Array.from({ length: segments }, (_, i) => (i % 2 === 0 ? 'tags' : 'articles_id'));
}

/** A field path of exactly `segments` segments, ending on a scalar. */
function fieldPath(segments: number) {
	return [...path(segments - 1), 'id'].join('.');
}

/** A nested filter object of exactly `segments` levels, ending on a scalar condition. */
function nested(segments: number, leaf: Record<string, unknown>): Record<string, unknown> {
	return [...path(segments - 1), 'id'].reduceRight<Record<string, unknown>>((acc, key) => ({ [key]: acc }), leaf);
}

/**
 * A `deep` object of exactly `segments` levels. The `_filter` key itself does not count towards
 * the depth, but the field it conditions on does.
 */
function deepNested(segments: number): Record<string, unknown> {
	return path(segments - 1).reduceRight<Record<string, unknown>>((acc, key) => ({ [key]: acc }), {
		_filter: { id: { _nnull: true } },
	});
}

await api.request(
	createItem(collections.articles, {
		title: 'depth',
		tags: [{ tags_id: { tag: 'depth' } }],
	}),
);

test('allows a field path up to the relational depth limit', async () => {
	const result = await api.request(
		readItems(collections.articles, { fields: [fieldPath(MAX_DEPTH)], filter: { title: { _eq: 'depth' } } }),
	);

	expect(result.length).toBe(1);
});

test('denies a field path over the relational depth limit', async () => {
	await expect(
		api.request(readItems(collections.articles, { fields: [fieldPath(MAX_DEPTH + 1)] })),
	).rejects.toMatchObject({
		errors: [{ message: MESSAGE }],
	});
});

test('allows a filter up to the relational depth limit', async () => {
	const result = await api.request(
		readItems(collections.articles, {
			filter: { _and: [{ title: { _eq: 'depth' } }, nested(MAX_DEPTH, { _nnull: true }) as any] },
		}),
	);

	expect(result.length).toBe(1);
});

test('denies a filter over the relational depth limit', async () => {
	await expect(
		api.request(readItems(collections.articles, { filter: nested(MAX_DEPTH + 1, { _nnull: true }) as any })),
	).rejects.toMatchObject({
		errors: [{ message: MESSAGE }],
	});
});

test('allows a sort up to the relational depth limit', async () => {
	const result = await api.request(
		readItems(collections.articles, { sort: [fieldPath(MAX_DEPTH)], filter: { title: { _eq: 'depth' } } }),
	);

	expect(result.length).toBe(1);
});

test('denies a sort over the relational depth limit', async () => {
	await expect(
		api.request(readItems(collections.articles, { sort: [fieldPath(MAX_DEPTH + 1)] })),
	).rejects.toMatchObject({
		errors: [{ message: MESSAGE }],
	});
});

test('allows a deep parameter up to the relational depth limit', async () => {
	const result = await api.request(
		readItems(collections.articles, {
			fields: ['id', 'tags.id'],
			filter: { title: { _eq: 'depth' } },
			deep: deepNested(MAX_DEPTH) as any,
		}),
	);

	expect(result.length).toBe(1);
});

test('denies a deep parameter over the relational depth limit', async () => {
	await expect(
		api.request(
			readItems(collections.articles, {
				deep: deepNested(MAX_DEPTH + 1) as any,
			}),
		),
	).rejects.toMatchObject({
		errors: [{ message: MESSAGE }],
	});
});

test('denies a GraphQL selection over the relational depth limit', async () => {
	const selection = [...path(MAX_DEPTH), 'id'].reduceRight((acc, key) => `${key} { ${acc} }`);

	await expect(
		api.query(`
			query {
				${collections.articles} { ${selection} }
			}
		`),
	).rejects.toMatchObject({
		errors: [{ message: MESSAGE }],
	});
});
