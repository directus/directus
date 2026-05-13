import { randomUUID } from 'node:crypto';
import { createLicense } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createCollection,
	createDirectus,
	deleteCollection,
	type DirectusClient,
	type DirectusCollection,
	type NestedPartial,
	readCollections,
	rest,
	type RestClient,
	staticToken,
	updateCollection,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

const LIMIT = 3;

let createdCollections: string[] = [];

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;

const license = createLicense({
	meta: { name: 'collections-entitlement-test' },
	entitlements: {
		collections: { limit: LIMIT },
	},
});

async function createEmptyCollection(name: string, overrides?: NestedPartial<DirectusCollection<any>>) {
	return api.request(
		createCollection({
			collection: name,
			fields: [
				{
					field: 'id',
					type: 'integer',
					meta: { hidden: true, interface: 'input', readonly: true },
					schema: { is_primary_key: true, has_auto_increment: true },
				},
			],
			schema: {},
			meta: {},
			...(overrides ?? {}),
		}),
	);
}

async function fillCollectionLimit(prefix: string) {
	for (let i = 1; i <= LIMIT; i++) {
		const name = prefix + '_collection_entitlement_' + i;

		await createEmptyCollection(name);

		createdCollections.push(name);
	}
}

beforeAll(async () => {
	const devMode = process.env['NODE_ENV'] === 'development';

	directus = await sandbox(database, {
		dev: devMode,
		watch: devMode,
		prefix: database,
		env: {
			CACHE_SCHEMA: 'false',
			DB_FILENAME: `directus_test_${randomUUID()}.db`,
			LICENSE_KEY: license.key,
			DB_EXCLUDE_TABLES: 'secrets',
		},
		extras: {
			license: true,
		},
		cache: false,
		knex: true,
		hooks: {
			beforeApi: async ({ env, knex }) => {
				// Register the license with the mock license server before the api boots so
				// directus picks it up via the LICENSE_KEY env var (avoids the activate path).
				await fetch(`http://localhost:${env.LICENSE_PORT}/admin/license`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(license),
				});

				// Create a db only table
				await knex?.schema.createTable('db_only_collection', (table) => {
					table.increments('id').primary();
				});
			},
		},
	});

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
});

afterAll(async () => {
	await directus?.stop();
});

describe('collections entitlement', () => {
	afterEach(async () => {
		for (const name of createdCollections) {
			try {
				await api.request(deleteCollection(name));
			} catch {
				// ignore cleanup failures
			}
		}

		createdCollections = [];
	});

	test('can successfully create collections within the limit', async () => {
		await fillCollectionLimit('a');

		const all = await api.request(readCollections());

		const activeUserTables = all.filter((c) => {
			return !c['meta']?.system && 'schema' in c && c['meta']?.status === 'active';
		});

		expect(activeUserTables).toHaveLength(LIMIT);
	});

	test('creating a collection above the license limit rejects with LIMIT_EXCEEDED', async () => {
		await fillCollectionLimit('b');

		const collection = 'b_collection_entitlement_' + (LIMIT + 1);

		await expect(createEmptyCollection(collection)).rejects.toMatchObject({
			errors: [
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: 'LIMIT_EXCEEDED',
					}),
				}),
			],
		});
	});

	test('creating a folder above the license limit succeeds', async () => {
		await fillCollectionLimit('c');

		await expect(
			api.request(
				createCollection({
					collection: 'c_collection_entitlement_folder',
					meta: {},
				}),
			),
		).resolves.toBeDefined();

		createdCollections.push('c_collection_entitlement_folder');
	});

	test('creating an inactive collection above the license limit succeeds', async () => {
		await fillCollectionLimit('d');

		await expect(
			createEmptyCollection('d_collection_entitlement_inactive', {
				meta: { status: 'inactive' },
			}),
		).resolves.toBeDefined();

		createdCollections.push('d_collection_entitlement_inactive');
	});

	test('deactivating an existing collection allows new creation', async () => {
		await fillCollectionLimit('e');

		await api.request(
			updateCollection(createdCollections[0]!, {
				meta: { status: 'inactive' } as any,
			}),
		);

		const collection = 'e_collection_entitlement_' + (LIMIT + 1);

		await expect(createEmptyCollection(collection)).resolves.toBeDefined();

		createdCollections.push(collection);
	});

	test('can deactivate an existing collection remaining over the limit', async () => {
		await fillCollectionLimit('f');

		// create 2 collections over the limit
		await directus.knex!.schema.createTable('f_collection_entitlement_extra_1', (table) => {
			table.increments('id').primary();
		});

		await directus.knex!.schema.createTable('f_collection_entitlement_extra_2', (table) => {
			table.increments('id').primary();
		});

		await directus.knex!('directus_collections').insert({ collection: 'f_collection_entitlement_extra_1' });
		await directus.knex!('directus_collections').insert({ collection: 'f_collection_entitlement_extra_2' });

		createdCollections.push('f_collection_entitlement_extra_1');
		createdCollections.push('f_collection_entitlement_extra_2');

		// try to deactivate a collection
		await expect(
			api.request(
				updateCollection(createdCollections[0]!, {
					meta: { status: 'inactive' } as any,
				}),
			),
		).resolves.toBeDefined();
	});
});
