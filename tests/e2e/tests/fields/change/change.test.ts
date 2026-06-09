import {
	createCollection,
	createDirectus,
	createField,
	createItems,
	createRelation,
	deleteCollection,
	deleteField,
	readField,
	readItems,
	readMe,
	rest,
	staticToken,
	updateField,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { afterAll, describe, expect, test } from 'vitest';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

const [us, mal] = await api.request(
	createItems(collections.country, [
		{
			name: 'United States',
		},
		{
			name: 'Malaysia',
		},
	]),
);

afterAll(async () => {
	await api.request(deleteField(collections.country, 'flag_image'));
	await api.request(deleteField(collections.country, 'test_divider'));
	await api.request(deleteField(collections.country, 'to_be_deleted'));

	// Created (as a sanitized plain geometry column) by the SQL injection regression test
	await api.request(deleteCollection('geom_injection')).catch(() => {
		// Collection may not exist if the request was rejected
	});
});

await api.request(
	createItems(collections.state, [
		{
			name: 'Washington',
			country: us!.id!,
		},
		{
			name: 'California',
			country: us!.id!,
		},
		{
			name: 'Johor',
			country: mal!.id!,
		},
		{
			name: 'Sarawak',
			country: mal!.id!,
		},
	]),
);

describe('/fields', () => {
	describe('DELETE /:collection/:field', () => {
		test('with foreign key constraints does not clear existing data', async () => {
			// Setup
			const newFieldName = 'to_be_deleted';

			const statesBefore = await api.request(readItems(collections.state));

			await api.request(
				createField(collections.country, {
					field: newFieldName,
					type: 'string',
				}),
			);

			await api.request(deleteField(collections.country, newFieldName));

			const statesAfter = await api.request(readItems(collections.state));

			// Assert
			expect(statesAfter).toStrictEqual(statesBefore);
		});
	});

	describe('POST /:collection', () => {
		test('with new relations does not clear existing data', async () => {
			// Setup
			const fieldName = 'flag_image';

			const statesBefore = await api.request(readItems(collections.state));

			await api.request(
				createField(collections.country, {
					field: fieldName,
					type: 'uuid',
					schema: {},
					meta: { interface: 'file-image', special: ['file'] },
				}),
			);

			await api.request(
				createRelation({
					collection: collections.country,
					field: fieldName,
					related_collection: 'directus_files',
					meta: { sort_field: null },
					schema: { on_delete: 'SET NULL' },
				}),
			);

			const statesAfter = await api.request(readItems(collections.state));

			// Assert
			expect(statesBefore).toStrictEqual(statesAfter);
		});

		test('can create new virtual alias field', async () => {
			// Setup
			const fieldName = 'test_divider';

			const field = await api.request(
				createField(collections.country, {
					field: fieldName,
					type: 'alias',
					meta: {
						interface: 'presentation-divider',
						special: ['alias', 'no-data'],
						options: { title: 'Test Divider' },
					},
				}),
			);

			// Assert
			expect(field).toEqual(
				expect.objectContaining({
					field: fieldName,
					type: 'alias',
					collection: collections.country,
				}),
			);
		});

		test('invalid geometry subtype does not execute', async () => {
			// Setup
			const admin = await api.request(readMe({ fields: ['email'] }));
			const subtype = `Point, 4326)); UPDATE "${collections.country}" SET name = (SELECT email FROM directus_users LIMIT 1); --`;

			const countriesBefore = await api.request(readItems(collections.country));

			// Action - attempt to create a collection whose geometry field subtype carries an injected statement
			await api
				.request(
					createCollection({
						collection: 'geom_injection',
						fields: [
							{
								field: 'id',
								type: 'integer',
								schema: { is_primary_key: true, has_auto_increment: true },
							},
							{
								field: 'geom',
								type: `geometry.${subtype}`,
								schema: {},
							},
						],
						schema: {},
					}),
				)
				.catch(() => {
					// A rejected request is fine - we only care that the injected statement never ran
				});

			const countriesAfter = await api.request(readItems(collections.country));

			// Assert - no admin data was exfiltrated and existing data is untouched
			expect(countriesAfter.map((country) => country.name)).not.toContain(admin.email);
			expect(countriesAfter).toStrictEqual(countriesBefore);
		});
	});

	describe('PATCH /:collection', () => {
		test('can sort virtual alias field', async () => {
			// Setup
			const fieldName = 'test_divider';
			const updatedSort = 100;

			const field = await api.request(
				updateField(collections.country, fieldName, {
					meta: {
						sort: updatedSort,
						group: null,
					},
				}),
			);

			expect(field).toMatchObject(
				expect.objectContaining({
					field: fieldName,
					type: 'alias',
					meta: expect.objectContaining({
						sort: updatedSort,
					}),
					collection: collections.country,
				}),
			);
		});
	});

	describe('PATCH /:collection/:field', () => {
		test('can update virtual alias field', async () => {
			// Setup
			const fieldName = 'test_divider';
			const updatedTitle = 'Updated Divider';

			const field = await api.request(
				updateField(collections.country, fieldName, {
					meta: {
						options: { title: updatedTitle },
					},
					type: 'alias',
					schema: null as any,
				}),
			);

			expect(field).toMatchObject({
				field: fieldName,
				type: 'alias',
				meta: expect.objectContaining({
					options: expect.objectContaining({ title: updatedTitle }),
				}),
				collection: collections.country,
			});
		});

		test('can update meta only without schema changes for relational field', async () => {
			// Setup
			const fieldName = 'fields_change_change_country';

			const payload = await api.request(readField(collections.state, fieldName));

			payload.meta.options = { template: 'updated' };

			const response = await api.request(updateField(collections.state, fieldName, payload));

			expect(response).toEqual(payload);
		});
	});
});
