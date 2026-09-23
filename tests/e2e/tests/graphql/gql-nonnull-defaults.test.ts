import { randomUUID } from 'node:crypto';
import { createCollection, createDirectus, deleteCollection, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { afterEach, expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

const created: string[] = [];

afterEach(async () => {
	for (const collection of created.splice(0)) {
		await api.request(deleteCollection(collection)).catch(() => {});
	}
});

function collectionName() {
	// GraphQL type names must be valid identifiers, so strip dashes
	const collection = `gql_nonnull_${randomUUID().replaceAll('-', '')}`;
	created.push(collection);
	return collection;
}

function typeBlock(sdl: string, typeName: string) {
	const match = sdl.match(new RegExp(`(?:type|input) ${typeName} \\{([^}]*)\\}`, 's'));

	if (!match) throw new Error(`Type ${typeName} not found in GraphQL schema`);

	return match[1];
}

test('gql schema emits non-null types for NOT NULL fields with defaults in read', async () => {
	const collection = collectionName();

	await api.request(
		createCollection({
			collection,
			schema: {},
			meta: {},
			fields: [
				{
					field: 'id',
					type: 'integer',
					meta: { hidden: true, interface: 'input', readonly: true },
					schema: { is_primary_key: true, has_auto_increment: true },
				},
				{
					field: 'title',
					type: 'string',
					meta: { interface: 'input' },
					schema: { is_nullable: false, default_value: 'untitled' },
				},
				{
					field: 'subtitle',
					type: 'string',
					meta: { interface: 'input' },
					schema: { is_nullable: false },
				},
				{
					field: 'note',
					type: 'string',
					meta: { interface: 'input' },
					schema: { is_nullable: true, default_value: 'n/a' },
				},
			],
		}),
	);

	const sdl = await (await fetch(`http://localhost:${port}/server/specs/graphql/?access_token=admin`)).text();

	// read type is named after the collection
	const readFields = typeBlock(sdl, collection);

	// NOT NULL with a default value is non-null in read (the #28280 fix)
	expect(readFields).toMatch(/^\s*title: String!/m);

	// NOT NULL without a default value is non-null in read (unchanged behavior)
	expect(readFields).toMatch(/^\s*subtitle: String!/m);

	// nullable field with a default value stays nullable in read
	expect(readFields).toMatch(/^\s*note: String$/m);
	expect(readFields).not.toMatch(/^\s*note: String!/m);

	// create input keeps defaulted fields omittable (nullable)
	const createInput = typeBlock(sdl, `create_${collection}_input`);
	expect(createInput).toMatch(/^\s*title: String$/m);
	expect(createInput).not.toMatch(/^\s*title: String!/m);
});
