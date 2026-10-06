import { createDirectus, readRelation, rest, staticToken, updateRelation } from '@directus/sdk';
import { database, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

const timeout = database === 'cockroachdb' ? 60_000 : 20_000;

test('a meta only update leaves the foreign key on the table', { timeout }, async () => {
	await api.request(updateRelation(collections.articles, 'author', { meta: { sort_field: null } }));

	const relation = await api.request(readRelation(collections.articles, 'author'));

	expect(relation.schema).toBeTruthy();
	expect(relation.schema.on_delete).toBe('CASCADE');
});

test('a schema update changes the trigger on the table', { timeout }, async () => {
	await api.request(updateRelation(collections.articles, 'editor', { schema: { on_delete: 'SET NULL' } as any }));

	const updated = await api.request(readRelation(collections.articles, 'editor'));

	expect(updated.schema.on_delete).toBe('SET NULL');

	await api.request(updateRelation(collections.articles, 'editor', { schema: { on_delete: 'CASCADE' } as any }));

	const restored = await api.request(readRelation(collections.articles, 'editor'));

	expect(restored.schema.on_delete).toBe('CASCADE');
});
