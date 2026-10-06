import { randomUUID } from 'node:crypto';
import { createCollection, createDirectus, deleteCollection, rest, staticToken } from '@directus/sdk';
import { database, port } from '@utils/constants.js';
import { afterAll, expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

const collection = `gql_nonnull_${randomUUID().replaceAll('-', '')}`;

afterAll(async () => {
	await api.request(deleteCollection(collection));
});

function typeBlock(sdl: string, typeName: string) {
	const match = sdl.match(new RegExp(`(?:type|input) ${typeName} \\{([^}]*)\\}`, 's'));

	if (!match) throw new Error(`Type ${typeName} not found in GraphQL schema`);

	return match[1];
}

test('gql schema marks NOT NULL fields with defaults non-null in read but optional in create', async () => {
	await api.request(
		createCollection({
			collection,
			schema: {},
			meta: {},
			fields: [
				{ field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true } },
				{ field: 'title', type: 'string', schema: { is_nullable: false, default_value: 'untitled' } },
				{ field: 'flag', type: 'boolean', schema: { is_nullable: false, default_value: false } },
			],
		}),
	);

	const sdl = await (await fetch(`http://localhost:${port}/server/specs/graphql/?access_token=admin`)).text();

	expect(typeBlock(sdl, collection)).toMatch(/^\s*title: String!$/m);

	const createInput = typeBlock(sdl, `create_${collection}_input`);
	expect(createInput).toMatch(/^\s*title: String$/m);
	// Booleans are stored as number(1) on Oracle, so they come back as Int
	expect(createInput).toMatch(database === 'oracle' ? /^\s*flag: Int$/m : /^\s*flag: Boolean$/m);
});
