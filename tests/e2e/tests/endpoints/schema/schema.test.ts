import { sandbox } from '@directus/sandbox';
import {
	createCollection,
	createDirectus,
	createField,
	createRelation,
	deleteCollection,
	readCollection,
	readField,
	readFieldsByCollection,
	rest,
	schemaApply,
	schemaDiff,
	schemaSnapshot,
	staticToken,
	updateCollection,
	updateField,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { readFile } from 'fs/promises';
import getPort from 'get-port';
import { join } from 'path';
import { afterAll, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { sortBy } from 'lodash-es';

const port = await getPort();

const all = process.env['ALL'] === 'true';

if (!all) {
	await sandbox(database, {
		port,
		inspect: false,
		docker: {
			basePort: port + 2,
			suffix: getUID(),
		},
	});

	afterAll(async () => {
		const diff = await api.request(
			schemaDiff(
				{
					version: 1,
					directus: '42.0.1',
					vendor: 'postgres',
					collections: [],
					fields: [],
					relations: [],
				},
				true,
			),
		);

		if (diff) await api.request(schemaApply(diff));
	});

	const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
	const publicApi = createDirectus(`http://localhost:${port}`).with(rest());

	test('denies non-admin users', async () => {
		await expect(() => publicApi.request(schemaSnapshot())).rejects.toThrowError();

		await expect(() =>
			publicApi.request(
				schemaDiff(
					{
						version: 1,
						directus: '42.0.1',
						vendor: 'postgres',
						collections: [],
						fields: [],
						relations: [],
					},
					true,
				),
			),
		).rejects.toThrowError();

		const diff = await api.request(
			schemaDiff(
				{
					version: 1,
					directus: '42.0.1',
					vendor: 'postgres',
					collections: [],
					fields: [],
					relations: [],
				},
				true,
			),
		);

		await expect(() => publicApi.request(schemaApply(diff))).rejects.toThrowError();
	});

	test('retrieves empty snapshot (JSON)', async () => {
		const snapshot = await api.request(schemaSnapshot());

		expect(snapshot).toBeDefined();
		expect(snapshot.collections.length).toBe(0);
		expect(snapshot.fields.length).toBe(0);
		expect(snapshot.relations.length).toBe(0);
	});

	test('retrieves empty snapshot (YAML)', async () => {
		const snapshot = await fetch(`http://localhost:${port}/schema/snapshot?export=yaml`, {
			headers: {
				Authorization: 'Bearer admin',
			},
		});

		expect(await snapshot.text()).toBeDefined();
	});

	test('applies a snapshot', async () => {
		const snapshot = JSON.parse(await readFile(join(import.meta.dirname, 'snapshot.json'), { encoding: 'utf8' }));

		const diff = await api.request(schemaDiff(snapshot, true));
		if (diff) await api.request(schemaApply(diff));

		const result = await api.request(schemaSnapshot());

		expect(result.collections.length).toBe(8);
		expect(result.fields.length).toBe(24);
		expect(result.relations.length).toBe(6);
	});

	test('reapplies the same snaphot in yaml', async () => {
		const snapshot = await fetch(`http://localhost:${port}/schema/snapshot?export=yaml`, {
			headers: {
				Authorization: 'Bearer admin',
			},
		});

		const emptyDiff = await api.request(
			schemaDiff(
				{
					version: 1,
					directus: '42.0.1',
					vendor: 'postgres',
					collections: [],
					fields: [],
					relations: [],
				},
				true,
			),
		);

		await api.request(schemaApply(emptyDiff));
		const yaml = await snapshot.text();

		const form = new FormData();
		form.set('file', new Blob([yaml]), 'snapshot.yaml');

		const diffResponse = await fetch(`http://localhost:${port}/schema/diff`, {
			method: 'POST',
			body: form,
			headers: {
				Authorization: 'Bearer admin',
			},
		});

		const diff = ((await diffResponse.json()) as any)['data'];
		const form2 = new FormData();
		form2.set('file', new Blob([JSON.stringify(diff)]), 'diff.json');

		await fetch(`http://localhost:${port}/schema/apply`, {
			method: 'POST',
			body: form2,
			headers: {
				Authorization: 'Bearer admin',
			},
		});

		const result = await api.request(schemaSnapshot());

		expect(result.collections.length).toBe(8);
		expect(result.fields.length).toBe(24);
		expect(result.relations.length).toBe(6);
	});

	test('applies lhs that is not an object', async () => {
		await api.request(updateCollection('articles', { meta: { icon: 'abc', color: '#E35169' } }));

		const snapshot = JSON.parse(await readFile(join(import.meta.dirname, 'snapshot.json'), { encoding: 'utf8' }));

		const diff = await api.request(schemaDiff(snapshot, true));
		if (diff) await api.request(schemaApply(diff));

		const collection = await api.request(readCollection('articles'));

		expect(collection.meta.icon).toBe(null);
		expect(collection.meta.color).toBe(null);
	});

	test('applies Array type diffs', async () => {
		await api.request(
			updateField('articles', 'id', {
				meta: {
					translations: [
						{ language: 'en-US', translation: `name` },
						{ language: 'nl-NL', translation: `naam` },
					],
				},
			}),
		);

		const snapshot = await api.request(schemaSnapshot());

		await api.request(
			updateField('articles', 'id', {
				meta: {
					translations: [
						{ language: 'en-US', translation: `name` },
						{ language: 'es-ES', translation: `nombre` },
						{ language: 'nl-NL', translation: `naam` },
					],
				},
			}),
		);

		const diff = await api.request(schemaDiff(snapshot, true));
		if (diff) await api.request(schemaApply(diff));

		const collection = await api.request(readField('articles', 'id'));

		expect(collection.meta.translations).toEqual([
			{ language: 'en-US', translation: `name` },
			{ language: 'nl-NL', translation: `naam` },
		]);
	});

	test('applies with field meta changes', async () => {
		const fields = await api.request(readFieldsByCollection('articles'));

		const sorted = sortBy(fields, 'field').map((field, i) => {
			return {
				field: field.field,
				meta: {
					sort: i + 1,
				},
			};
		});

		for (const field of sorted) {
			await api.request(updateField('articles', field.field, field));
		}

		const snapshot = await api.request(schemaSnapshot());

		const sortedReverse = sortBy(fields, 'field')
			.reverse()
			.map((field, i) => {
				return {
					field: field.field,
					meta: {
						sort: i + 1,
					},
				};
			});

		for (const field of sortedReverse) {
			await api.request(updateField('articles', field.field, field));
		}

		const diff = await api.request(schemaDiff(snapshot, true));
		if (diff) await api.request(schemaApply(diff));

		const result = await api.request(readFieldsByCollection('articles'));

		expect(sortBy(result, 'meta.sort')).toMatchObject(sorted);
	});

	test('getSchema bypasses cache when fetching foreign keys', async () => {
		await api.request(
			createCollection({
				collection: 'a',
				meta: {},
				schema: {},
				fields: [
					{
						field: 'id',
						type: 'integer',
						schema: {
							is_primary_key: true,
							has_auto_increment: true,
						},
					},
				],
			}),
		);

		const snapshot = JSON.parse(await readFile(join(import.meta.dirname, 'snapshot.json'), { encoding: 'utf8' }));

		await api.request(
			createCollection({
				collection: 'b',
				meta: {},
				schema: {},
				fields: [
					{
						field: 'id',
						type: 'integer',
						schema: {
							is_primary_key: true,
							has_auto_increment: true,
						},
					},
				],
			}),
		);

		await api.request(
			createField('a', {
				collection: 'a',
				field: 'b_id',
				meta: {
					special: ['m2o'],
				},
				type: 'integer',
			}),
		);

		await api.request(
			createField('b', {
				collection: 'b',
				field: 'a_items',
				meta: {
					special: ['o2m'],
				},
				type: 'alias',
			}),
		);

		await api.request(
			createRelation({
				collection: 'a',
				field: 'b_id',
				schema: {
					on_delete: 'SET NULL',
				},
				meta: {
					many_collection: 'a',
					many_field: 'b_id',
					one_collection: 'b',
					one_field: 'a_items',
				},
				related_collection: 'b',
			}),
		);

		const diff = await api.request(schemaDiff(snapshot, true));

		await expect(api.request(schemaApply(diff))).resolves.toBe(null);
	});

	test('Hash Tests with deleted fields', async () => {
		await api.request(
			createCollection({
				collection: 'a',
				meta: {},
				schema: {},
				fields: [
					{
						field: 'id',
						type: 'integer',
						schema: {
							is_primary_key: true,
							has_auto_increment: true,
						},
					},
				],
			}),
		);

		const snapshot = JSON.parse(await readFile(join(import.meta.dirname, 'snapshot.json'), { encoding: 'utf8' }));

		const diff = await api.request(schemaDiff(snapshot, true));

		await api.request(deleteCollection('a'));

		await expect(() => api.request(schemaApply(diff))).rejects.toThrowError();
	});

	test('Hash Tests with new collection', async () => {
		const snapshot = JSON.parse(await readFile(join(import.meta.dirname, 'snapshot.json'), { encoding: 'utf8' }));

		const diff = await api.request(schemaDiff(snapshot, true));

		await api.request(
			createCollection({
				collection: 'temp',
				meta: {},
				schema: {},
				fields: [
					{
						field: 'id',
						type: 'integer',
						schema: {
							is_primary_key: true,
							has_auto_increment: true,
						},
					},
				],
			}),
		);

		await expect(() => api.request(schemaApply(diff))).rejects.toThrowError();
	});

	test('applies an empty snapshot on a seeded db', async () => {
		const diff = await api.request(
			schemaDiff(
				{
					version: 1,
					directus: '42.0.1',
					vendor: 'postgres',
					collections: [],
					fields: [],
					relations: [],
				},
				true,
			),
		);

		await api.request(schemaApply(diff));

		const result = await api.request(schemaSnapshot());

		expect(result.collections.length).toBe(0);
		expect(result.fields.length).toBe(0);
		expect(result.relations.length).toBe(0);
	});
}
