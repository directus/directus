import { randomUUID } from 'node:crypto';
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
	rest,
	staticToken,
	updateField,
} from '@directus/sdk';
import { database, port } from '@utils/constants.js';
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

	// Only exists if validation regressed and the injection collection was created
	await api.request(deleteCollection('geom_injection')).catch(() => {});
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

		// Skip if oracle as CI option lacks spatial support
		test.skipIf(database === 'oracle')('SQL injection via geometry subtype does not execute', async () => {
			// The injection embeds a SELECT against a non-existent table which will error if executed
			const subtype = `Point, 4326)); SELECT * FROM "directus_geom_injection_canary"; --`;

			await api.request(
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
			);

			// And the column itself fell back to plain geometry
			const field = await api.request(readField('geom_injection', 'geom'));
			expect(field.type).toBe('geometry');
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

describe('/fields on a system collection', () => {
	const userField = `user_field_${randomUUID().split('-')[0]!}`;

	test('a user created field can be added to, updated on and removed from a system collection', async () => {
		const created = await api.request(
			createField('directus_users', {
				field: userField,
				type: 'string',
				meta: { interface: 'input', special: null },
			} as any),
		);

		expect(created).toMatchObject({ collection: 'directus_users', field: userField, type: 'string' });

		const updated = await api.request(updateField('directus_users', userField, { meta: { note: 'noted' } } as any));

		expect(updated).toMatchObject({ field: userField, meta: expect.objectContaining({ note: 'noted' }) });

		await api.request(deleteField('directus_users', userField));

		await expect(api.request(readField('directus_users', userField))).rejects.toThrowError();
	});

	test('an index can be added to a system field', async () => {
		await api.request(
			updateField('directus_users', 'first_name', {
				collection: 'directus_users',
				field: 'first_name',
				schema: { is_indexed: true },
			} as any),
		);

		const field = await api.request(readField('directus_users', 'first_name'));

		expect(field.schema?.is_indexed).toBe(true);
	});

	// Postgres builds the index outside of a transaction when asked to do it concurrently
	test('an index can be added to a system field concurrently', async () => {
		const response = await fetch(`http://localhost:${port}/fields/directus_users/last_name?concurrentIndexCreation`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json', Authorization: 'Bearer admin' },
			body: JSON.stringify({
				collection: 'directus_users',
				field: 'last_name',
				schema: { is_indexed: true },
			}),
		});

		expect(response.status).toBe(200);

		const field = await api.request(readField('directus_users', 'last_name'));

		expect(field.schema?.is_indexed).toBe(true);
	});

	test('anything other than the index cannot be changed on a system field', async () => {
		await expect(
			api.request(
				updateField('directus_users', 'first_name', {
					collection: 'directus_users',
					field: 'first_name',
					type: 'string',
					schema: { is_nullable: false },
				} as any),
			),
		).rejects.toMatchObject({ errors: [{ message: expect.stringContaining('Invalid payload.') }] });

		await expect(
			api.request(
				updateField('directus_users', 'first_name', {
					collection: 'directus_users',
					field: 'first_name',
					type: 'string',
					meta: { options: { placeholder: 'Updated' } },
				} as any),
			),
		).rejects.toMatchObject({ errors: [{ message: expect.stringContaining('Invalid payload.') }] });
	});

	test('a system field cannot be deleted', async () => {
		await expect(api.request(deleteField('directus_users', 'description'))).rejects.toThrowError();

		// Still there afterwards
		expect(await api.request(readField('directus_users', 'description'))).toBeDefined();
	});
});
