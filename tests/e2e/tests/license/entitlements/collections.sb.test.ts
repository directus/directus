import { randomUUID } from 'node:crypto';
import { activateLicense, deactivateLicense } from '@directus/license';
import { createLicense, mockClient } from '@directus/mock-license-server';
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
import { getUID } from '@utils/getUID.js';
import { merge } from 'lodash-es';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { createSandboxOptions } from '../shared.js';

const restrictedLicense = createLicense({
	meta: { name: 'collections-restricted' },
	entitlements: { collections: { limit: LIMIT } },
});

const unlimitedLicense = createLicense({
	meta: { name: 'collections-unlimited' },
	entitlements: { collections: { limit: -1 } },
});

function buildCollection(collection: string, overrides?: NestedPartial<DirectusCollection<any>>) {
	return merge(
		{
			collection,
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
		},
		overrides,
	);
}

async function seedCollectionsToLimit(api: DirectusClient<unknown> & RestClient<unknown>, limit?: number) {
	for (let i = 1; i <= (limit || 3); i++) {
		await api.request(createCollection(buildCollection(`${getUID()}_${i}`)));
	}
}

describe('collections', () => {
	let directus: Sandbox;
	let api: DirectusClient<unknown> & RestClient<unknown>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			createSandboxOptions({
				extras: { license: true },
				knex: true,
				env: {
					DB_EXCLUDE_TABLES: `${getUID()}_excluded`,
				},
				hooks: {
					beforeApi: async ({ env }) => {
						const base = `http://localhost:${env.LICENSE_PORT}`;
						mockClient.registerLicense(base, restrictedLicense);
						mockClient.registerLicense(base, unlimitedLicense);
					},
				},
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
	});

	afterAll(async () => {
		await directus?.stop();
	});

	afterEach(async () => {
		const collections = await api.request(readCollections());

		for (const { collection } of collections) {
			if (collection.includes(getUID()) === false) {
				continue;
			}

			try {
				await api.request(deleteCollection(collection));
			} catch {
				// ignore cleanup failures
			}
		}
	});

	describe('collections=3', () => {
		beforeAll(async () => {
			await api.request(activateLicense({ license_key: restrictedLicense.key }));
		});

		afterAll(async () => {
			await api.request(deactivateLicense());
		});

		test('creating collections within the limit with existing db only table succeeds', async () => {
			await directus.knex?.schema.createTable(`${getUID()}_db_only_collection`, (table) => {
				table.increments('id').primary();
			});

			await expect(seedCollectionsToLimit(api));
		});

		test('creating collections within the limit and with existing DB_EXCLUDED_TABLES table succeeds', async () => {
			await directus.knex?.schema.createTable(`${getUID()}_excluded`, (table) => {
				table.increments('id').primary();
			});

			await expect(seedCollectionsToLimit(api));
		});

		test('creating a collection above the limit rejects with LIMIT_EXCEEDED', async () => {
			await seedCollectionsToLimit(api);

			await expect(api.request(createCollection(buildCollection(`${getUID()}_${LIMIT + 1}`)))).rejects.toMatchObject({
				errors: [
					expect.objectContaining({
						extensions: expect.objectContaining({ code: 'LIMIT_EXCEEDED' }),
					}),
				],
			});
		});

		test('creating a folder when above the limit succeeds', async () => {
			await seedCollectionsToLimit(api);

			await expect(
				api.request(
					createCollection({
						collection: `${getUID()}_folder`,
						meta: {},
						schema: null,
					}),
				),
			).resolves.toBeDefined();
		});

		test('creating an inactive collection when above the limit succeeds', async () => {
			await seedCollectionsToLimit(api);

			await expect(
				api.request(
					createCollection(
						buildCollection(`${getUID()}_inactive`, {
							meta: { status: 'inactive' },
						}),
					),
				),
			).resolves.toBeDefined();
		});

		test('updating an existing collection as inactive reduces the limit', async () => {
			await seedCollectionsToLimit(api);

			await api.request(
				updateCollection(`${getUID()}_1`, {
					meta: { status: 'inactive' },
				}),
			);

			await expect(api.request(createCollection(buildCollection(`${getUID()}_new`)))).resolves.toBeDefined();
		});

		test('updating any field aside from status succeeds', async () => {
			await seedCollectionsToLimit(api);

			// Pure update at the limit — no status field, so should not be counted as a new active collection.
			await expect(
				api.request(
					updateCollection(`${getUID()}_1`, {
						meta: { note: 'updated note' },
					}),
				),
			).resolves.toBeDefined();
		});

		test('updating an existing collection to inactive while over the limit succeeds', async () => {
			await seedCollectionsToLimit(api);

			// Seed two extra active collections directly via knex to push count over the limit.
			for (const suffix of ['extra_1', 'extra_2']) {
				const name = `${getUID()}_${suffix}`;

				await directus.knex!.schema.createTable(name, (table) => {
					table.increments('id').primary();
				});

				await directus.knex!('directus_collections').insert({ collection: name });
			}

			await expect(
				api.request(
					updateCollection(`${getUID()}_1`, {
						meta: { status: 'inactive' },
					}),
				),
			).resolves.toBeDefined();
		});
	});
});
