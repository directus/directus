import { randomUUID } from 'node:crypto';
import { createLicense } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createCollection,
	createDirectus,
	deleteCollection,
	type DirectusClient,
	readCollections,
	rest,
	type RestClient,
	staticToken,
	updateCollection,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const LIMIT = 3;

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;

const license = createLicense({
	meta: { name: 'collections-entitlement-test' },
	entitlements: {
		collections: { limit: LIMIT },
	},
});

const createdCollections: string[] = [];

function nextCollectionName() {
	const name = `ent_collections_${createdCollections.length}_${getUID()}`;
	createdCollections.push(name);
	return name;
}

async function createActiveCollection(name: string) {
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
		}),
	);
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
		},
		extras: {
			license: true,
		},
		cache: false,
		hooks: {
			beforeApi: async ({ env }) => {
				// Register the license with the mock license server before the api boots so
				// directus picks it up via the LICENSE_KEY env var (avoids the activate path).
				await fetch(`http://localhost:${env.LICENSE_PORT}/admin/license`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(license),
				});
			},
		},
	});

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
});

afterAll(async () => {
	for (const name of createdCollections) {
		try {
			await api.request(deleteCollection(name));
		} catch {
			// ignore cleanup failures
		}
	}

	await directus.stop();
});

describe('collections entitlement', () => {
	test('creating collections up to the license limit succeeds', async () => {
		for (let i = 0; i < LIMIT; i++) {
			const name = nextCollectionName();
			const result = await createActiveCollection(name);
			expect(result).toMatchObject({ collection: name });
		}

		const all = await api.request(readCollections());
		const ours = all.filter((c: any) => createdCollections.includes(c.collection));

		expect(ours).toHaveLength(LIMIT);
	});

	test('creating one collection above the license limit rejects with LIMIT_EXCEEDED', async () => {
		const overName = `ent_collections_overflow_${getUID()}`;

		await expect(createActiveCollection(overName)).rejects.toMatchObject({
			errors: [
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: 'LIMIT_EXCEEDED',
					}),
				}),
			],
		});
	});

	test('deactivating a collection frees up a slot for a new active collection', async () => {
		const victim = createdCollections[0]!;

		await api.request(
			updateCollection(victim, {
				meta: { status: 'inactive' } as any,
			}),
		);

		const name = nextCollectionName();
		const result = await createActiveCollection(name);
		expect(result).toMatchObject({ collection: name });
	});

	test('creating again after slot is filled rejects with LIMIT_EXCEEDED', async () => {
		const overName = `ent_collections_overflow2_${getUID()}`;

		await expect(createActiveCollection(overName)).rejects.toMatchObject({
			errors: [
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: 'LIMIT_EXCEEDED',
					}),
				}),
			],
		});
	});

	test('creating a folder (schema: null) is not counted toward the limit', async () => {
		const folderName = `ent_collections_folder_${getUID()}`;
		createdCollections.push(folderName);

		const result = await api.request(
			createCollection({
				collection: folderName,
				schema: null,
				meta: {},
			} as any),
		);

		expect(result).toMatchObject({ collection: folderName, schema: null });
	});
});
