import { SchemaBuilder } from '@directus/schema-builder';
import type { Permission } from '@directus/types';
import { expect, test, vi } from 'vitest';
import { getSpecFingerprint } from './get-spec-fingerprint.js';

test('is the same regardless of field and relation order', () => {
	const ordered = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').integer().primary();
			c.field('author').m2o('authors');
			c.field('editor').m2o('authors');
		})
		.build();

	const reversed = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('editor').m2o('authors');
			c.field('author').m2o('authors');
			c.field('id').integer().primary();
		})
		.build();

	expect(getSpecFingerprint(reversed, [])).toEqual(getSpecFingerprint(ordered, []));
});

test('is the same regardless of permission order, duplicates or fields', () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').integer().primary();
		})
		.build();

	const permissions = [
		{ collection: 'articles', action: 'read', fields: ['*'] },
		{ collection: 'articles', action: 'update', fields: ['*'] },
	] as Permission[];

	const reshuffled = [
		{ collection: 'articles', action: 'update', fields: ['id'] },
		{ collection: 'articles', action: 'read', fields: ['id'] },
		{ collection: 'articles', action: 'read', fields: ['*'] },
	] as Permission[];

	expect(getSpecFingerprint(schema, reshuffled)).toEqual(getSpecFingerprint(schema, permissions));
});

test('ignores permissions on collections outside the schema', () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').integer().primary();
		})
		.build();

	const readable = [{ collection: 'articles', action: 'read', fields: ['*'] }] as Permission[];

	const withUnreadable = [
		{ collection: 'articles', action: 'read', fields: ['*'] },
		{ collection: 'secrets', action: 'create', fields: ['*'] },
	] as Permission[];

	expect(getSpecFingerprint(schema, withUnreadable)).toEqual(getSpecFingerprint(schema, readable));
});

test('changes when the Directus version changes', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').integer().primary();
		})
		.build();

	const current = getSpecFingerprint(schema, []);

	vi.resetModules();
	vi.doMock('directus/version', () => ({ version: '0.0.0-next' }));

	const { getSpecFingerprint: getForNextVersion } = await import('./get-spec-fingerprint.js');

	vi.doUnmock('directus/version');

	expect(getForNextVersion(schema, [])).not.toEqual(current);
});
