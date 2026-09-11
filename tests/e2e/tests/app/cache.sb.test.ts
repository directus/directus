import { randomUUID } from 'node:crypto';
import { type sandbox as Sandbox, sandbox } from '@directus/sandbox';
import { clearCache, createCollection, createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const CACHE_STATUS_HEADER = 'x-cache-status';

/** A collection that is auto purged, and one that the ignore list exempts. */
const NORMAL = 'cache_normal';
const IGNORED = 'cache_ignored';

/**
 * The store only changes where cache entries live, so auto purge is the axis under test here;
 * redis is covered once to confirm purging works against a shared store too.
 */
const CONFIGS = [
	{ name: 'a memory store without auto purge', store: 'memory', purge: false },
	{ name: 'a memory store with auto purge', store: 'memory', purge: true },
	{ name: 'a redis store with auto purge', store: 'redis', purge: true },
] as const;

for (const { name, store, purge } of CONFIGS) {
	describe(`caching with ${name}`, () => {
		let directus: Awaited<ReturnType<typeof Sandbox>>;
		let api: ReturnType<typeof createDirectus<any>> & any;

		beforeAll(async () => {
			directus = await sandbox(database, {
				port: sandboxPort(CONFIGS.findIndex((config) => config.store === store && config.purge === purge)),
				inspect: false,
				prefix: `cache-${store}-${purge}`,
				cache: true,
				extras: { redis: store === 'redis' },
				env: {
					CACHE_STATUS_HEADER,
					CACHE_AUTO_PURGE: String(purge),
					CACHE_AUTO_PURGE_IGNORE_LIST: `directus_activity,directus_presets,${IGNORED}`,
					CACHE_STORE: store,
					CACHE_NAMESPACE: `cache-${store}-${purge}`,
					DB_FILENAME: `directus_test_${getUID()}_${store}_${purge}.db`,
				},
				docker: { suffix: `${getUID()}${store}${purge}` },
			});

			api = createDirectus<any>(`http://localhost:${directus.apis[0]!.port}`).with(rest()).with(staticToken('admin'));

			for (const collection of [NORMAL, IGNORED]) {
				await api.request(
					createCollection({
						collection,
						fields: [
							{
								field: 'id',
								type: 'integer',
								meta: { hidden: true, interface: 'input', readonly: true },
								schema: { is_primary_key: true, has_auto_increment: true },
							},
							{ field: 'string_field', type: 'string' },
						],
						schema: {},
						meta: { singleton: false },
					} as any),
				);
			}
		}, 120_000);

		afterAll(async () => {
			await directus.stop();
		});

		/** Reads the collection and reports whether the response came from cache. */
		async function cacheStatus(collection: string, referer?: string) {
			const response = await fetch(`http://localhost:${directus.apis[0]!.port}/items/${collection}`, {
				headers: { Authorization: 'Bearer admin', ...(referer ? { Referer: referer } : {}) },
			});

			expect(response.status).toBe(200);

			return response.headers.get(CACHE_STATUS_HEADER);
		}

		const appReferer = (collection: string) => `${directus.env.PUBLIC_URL}/admin/content/${collection}/`;

		/**
		 * Does what the app does while a user browses a collection: tracks the page through the
		 * dedicated endpoint and saves a preset. Neither is supposed to purge the data cache.
		 */
		async function browseApp(collection: string, referer?: string) {
			const base = `http://localhost:${directus.apis[0]!.port}`;

			const headers = {
				'Content-Type': 'application/json',
				Authorization: 'Bearer admin',
				...(referer ? { Referer: referer } : {}),
			};

			await fetch(`${base}/users/me/track/page`, {
				method: 'PATCH',
				headers,
				body: JSON.stringify({ last_page: `/content/${collection}` }),
			});

			const preset = await (
				await fetch(`${base}/presets`, { method: 'POST', headers, body: JSON.stringify({ collection }) })
			).json();

			await fetch(`${base}/presets/${preset.data.id}`, {
				method: 'PATCH',
				headers,
				body: JSON.stringify({ collection }),
			});
		}

		for (const collection of [NORMAL, IGNORED]) {
			const ignored = collection === IGNORED;

			test(`browsing ${collection} without a referer keeps the cache`, async () => {
				await api.request(clearCache());

				await cacheStatus(collection);
				await browseApp(collection);

				expect(await cacheStatus(collection)).toBe('HIT');
			});

			test(`browsing ${collection} with an app referer skips the cache only when it has to`, async () => {
				const referer = appReferer(collection);

				await api.request(clearCache());

				await cacheStatus(collection, referer);
				await browseApp(collection, referer);

				// Without auto purge the app always bypasses the cache; with it, only ignored paths do
				const expected = !purge || ignored ? 'MISS' : 'HIT';

				expect(await cacheStatus(collection, referer)).toBe(expected);
			});

			test(`mutating ${collection} purges the cache only when auto purge covers it`, async () => {
				await api.request(clearCache());

				await cacheStatus(collection);
				await api.request(createItem(collection, { string_field: randomUUID() }));

				expect(await cacheStatus(collection)).toBe(purge && !ignored ? 'MISS' : 'HIT');
			});

			test(`mutating ${collection} with an app referer never serves from cache`, async () => {
				const referer = appReferer(collection);

				await api.request(clearCache());

				await cacheStatus(collection, referer);
				await api.request(createItem(collection, { string_field: randomUUID() }));

				expect(await cacheStatus(collection, referer)).toBe('MISS');
			});

			test(`mutating ${collection} with an external referer falls back to the auto purge rules`, async () => {
				const referer = `http://external.example.com/admin/content/${collection}`;

				await api.request(clearCache());

				await cacheStatus(collection, referer);
				await api.request(createItem(collection, { string_field: randomUUID() }));

				expect(await cacheStatus(collection, referer)).toBe(purge && !ignored ? 'MISS' : 'HIT');
			});
		}
	});
}
