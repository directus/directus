import { type sandbox as Sandbox, sandbox } from '@directus/sandbox';
import { clearCache, createCollection, createDirectus, deleteCollection, readCollection, readFields, rest, staticToken } from '@directus/sdk'; // prettier-ignore
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const COLLECTION = 'schema_cache_probe';

/**
 * With a shared synchronization store the node that did not make the change still learns about
 * it; without one, its cached schema goes stale.
 */
const CONFIGS = [
	{ name: 'a shared synchronization store', store: 'redis', propagates: true },
	{ name: 'no shared synchronization store', store: 'memory', propagates: false },
] as const;

for (const { name, store, propagates } of CONFIGS) {
	describe(`a schema change with ${name}`, () => {
		let directus: Awaited<ReturnType<typeof Sandbox>>;
		let nodes: (ReturnType<typeof createDirectus<any>> & any)[];

		beforeAll(async () => {
			directus = await sandbox(database, {
				port: sandboxPort(CONFIGS.findIndex((config) => config.store === store)),
				inspect: false,
				prefix: `schema-cache-${store}`,
				instances: '2',
				cache: true,
				extras: { redis: store === 'redis' },
				env: {
					CACHE_AUTO_PURGE: 'true',
					CACHE_SCHEMA: 'true',
					// A per process memory cache, so each node keeps its own copy of the schema
					CACHE_STORE: 'memory',
					SYNCHRONIZATION_STORE: store,
					DB_FILENAME: `directus_test_${getUID()}_${store}.db`,
				},
				docker: { suffix: `${getUID()}${store}` },
			});

			nodes = directus.apis.map((instance) =>
				createDirectus<any>(`http://localhost:${instance.port}`).with(rest()).with(staticToken('admin')),
			);
		}, 120_000);

		afterAll(async () => {
			await directus.stop();
		});

		test(`${propagates ? 'reaches' : 'does not reach'} the other node`, async () => {
			await nodes[0].request(
				createCollection({
					collection: COLLECTION,
					fields: [
						{
							field: 'id',
							type: 'integer',
							meta: { hidden: true, interface: 'input', readonly: true },
							schema: { is_primary_key: true, has_auto_increment: true },
						},
					],
					schema: {},
					meta: { singleton: false },
				} as any),
			);

			// Warm both schema caches
			for (const node of nodes) {
				await node.request(clearCache());
				await node.request(readFields());
				expect(await node.request(readCollection(COLLECTION))).toBeDefined();
			}

			await nodes[0].request(deleteCollection(COLLECTION));

			// The node that made the change always knows about it
			await expect(nodes[0].request(readCollection(COLLECTION))).rejects.toThrowError();

			if (propagates) {
				await expect(nodes[1].request(readCollection(COLLECTION))).rejects.toThrowError();
			} else {
				expect(await nodes[1].request(readCollection(COLLECTION))).toBeDefined();
			}
		});
	});
}
