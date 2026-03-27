import { randomUUID } from 'crypto';
import { join } from 'path';
import { sandbox } from '@directus/sandbox';
import {
	clearCache,
	createDirectus,
	createItem,
	createPreset,
	readItems,
	rest,
	staticToken,
	updatePreset,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { describe, expect, test } from 'vitest';
import type { Schema } from './schema.js';

const all = process.env['ALL'] === 'true';

if (!all) {
	const uid = getUID();

	const directusMem = await sandbox(database, {
		cache: true,
		prefix: 'cache-mem',
		schema: join(import.meta.dirname, 'snapshot.json'),
		inspect: false,
		silent: true,
		docker: {
			suffix: `${uid}_mem`,
		},
		env: {
			CACHE_STATUS_HEADER: 'x-cache-status',
			CACHE_AUTO_PURGE: 'false',
			CACHE_AUTO_PURGE_IGNORE_LIST: `directus_activity,directus_presets,ignored`,
		},
	});

	const directusMemPurge = await sandbox(database, {
		cache: true,
		prefix: 'cache-mem-purge',
		schema: join(import.meta.dirname, 'snapshot.json'),
		inspect: false,
		silent: true,
		docker: {
			suffix: `${uid}_mem_purge`,
		},
		env: {
			CACHE_STATUS_HEADER: 'x-cache-status',
			CACHE_AUTO_PURGE: 'true',
			CACHE_AUTO_PURGE_IGNORE_LIST: `directus_activity,directus_presets,ignored`,
		},
	});

	const directusRedis = await sandbox(database, {
		cache: true,
		prefix: 'cache-redis',
		schema: join(import.meta.dirname, 'snapshot.json'),
		inspect: false,
		silent: true,
		docker: {
			suffix: `${uid}_redis`,
		},
		extras: {
			redis: true,
		},
		env: {
			CACHE_STATUS_HEADER: 'x-cache-status',
			CACHE_AUTO_PURGE: 'false',
			CACHE_AUTO_PURGE_IGNORE_LIST: `directus_activity,directus_presets,ignored`,
		},
	});

	const directusRedisPurge = await sandbox(database, {
		cache: true,
		prefix: 'cache-redis-purge',
		schema: join(import.meta.dirname, 'snapshot.json'),
		inspect: false,
		silent: true,
		docker: {
			suffix: `${uid}_redis_purge`,
		},
		extras: {
			redis: true,
		},
		env: {
			CACHE_STATUS_HEADER: 'x-cache-status',
			CACHE_AUTO_PURGE: 'true',
			CACHE_AUTO_PURGE_IGNORE_LIST: `directus_activity,directus_presets,ignored`,
		},
	});

	const instances = [directusMem, directusMemPurge, directusRedis, directusRedisPurge];

	for (const instance of instances) {
		const api = createDirectus<Schema>(`http://localhost:${instance.apis[0].port}`)
			.with(rest())
			.with(staticToken('admin'));

		await api.request(
			createItem('first', {
				text: 'test',
			}),
		);

		await api.request(
			createItem('ignored', {
				text: 'test',
			}),
		);
	}

	describe('Does not purge cache browsing app without Referer header', () => {
		for (const instance of instances) {
			for (const collection of ['first', 'ignored']) {
				test(`${instance.env.PUBLIC_URL} ${collection}`, async () => {
					const api = createDirectus<Schema>(`http://localhost:${instance.apis[0].port}`)
						.with(rest())
						.with(staticToken('admin'));

					await api.request(clearCache());

					await api.request(readItems(collection as any));

					await fetch(`http://localhost:${instance.apis[0].port}/users/me/track/page`, {
						method: 'PATCH',
						body: JSON.stringify({
							last_page: `/content/${collection}`,
						}),
						headers: {
							Authorization: 'Bearer admin',
						},
					});

					const presetId = (
						await api.request(
							createPreset({
								collection,
							}),
						)
					).id;

					await api.request(updatePreset(presetId, { collection }));

					const response = await fetch(`http://localhost:${instance.apis[0].port}/items/${collection}`, {
						headers: {
							Authorization: 'Bearer admin',
						},
					});

					// Assert
					expect(response.status).toBe(200);
					expect(response.headers.get('x-cache-status')).toBe('HIT');
				});
			}
		}
	});

	describe('Does not purge cache when browsing app with Referer header', () => {
		for (const instance of instances) {
			for (const collection of ['first', 'ignored']) {
				test(`${instance.env.PUBLIC_URL} ${collection}`, async () => {
					const referer = `${instance.env.PUBLIC_URL}/admin/content/${collection}/`;

					await fetch(`http://localhost:${instance.apis[0].port}/utils/cache/clear`, {
						headers: {
							Referer: referer,
							Authorization: 'Bearer admin',
						},
					});

					await fetch(`http://localhost:${instance.apis[0].port}/items/${collection}`, {
						headers: {
							Referer: referer,
							Authorization: 'Bearer admin',
						},
					});

					await fetch(`http://localhost:${instance.apis[0].port}/users/me/track/page`, {
						method: 'PATCH',
						body: JSON.stringify({
							last_page: `/content/${collection}`,
						}),
						headers: {
							Referer: referer,
							Authorization: 'Bearer admin',
						},
					});

					const preset = await fetch(`http://localhost:${instance.apis[0].port}/presets`, {
						method: 'POST',
						body: JSON.stringify({
							collection,
						}),
						headers: {
							Referer: referer,
							Authorization: 'Bearer admin',
						},
					});

					const presetId = ((await preset.json()) as any).data.id;

					await fetch(`http://localhost:${instance.apis[0].port}/presets/${presetId}`, {
						method: 'PATCH',
						body: JSON.stringify({
							collection,
						}),
						headers: {
							Referer: referer,
							Authorization: 'Bearer admin',
						},
					});

					const response = await fetch(`http://localhost:${instance.apis[0].port}/items/${collection}`, {
						headers: {
							Referer: referer,
							Authorization: 'Bearer admin',
						},
					});

					// Assert
					if (collection === 'first') {
						const expectedCacheStatus = (instance.env as any)['CACHE_AUTO_PURGE'] === 'true' ? 'HIT' : 'MISS';

						expect(response.status).toBe(200);
						expect(response.headers.get('x-cache-status')).toBe(expectedCacheStatus);
					} else {
						expect(response.status).toBe(200);
						expect(response.headers.get('x-cache-status')).toBe('MISS');
					}
				});
			}
		}
	});

	describe('Purges cache when item is mutated', () => {
		for (const instance of instances) {
			for (const collection of ['first', 'ignored'] as const) {
				test(`${instance.env.PUBLIC_URL} ${collection}`, async () => {
					const api = createDirectus<Schema>(`http://localhost:${instance.apis[0].port}`)
						.with(rest())
						.with(staticToken('admin'));

					await api.request(clearCache());

					await api.request(readItems(collection as any));

					await api.request(
						createItem(collection, {
							text: randomUUID(),
						}),
					);

					const response = await fetch(`http://localhost:${instance.apis[0].port}/items/${collection}`, {
						headers: {
							Authorization: 'Bearer admin',
						},
					});

					// Assert
					if (collection === 'first') {
						const expectedCacheStatus = (instance.env as any)['CACHE_AUTO_PURGE'] === 'true' ? 'MISS' : 'HIT';

						expect(response.status).toBe(200);
						expect(response.headers.get('x-cache-status')).toBe(expectedCacheStatus);
					} else {
						expect(response.status).toBe(200);
						expect(response.headers.get('x-cache-status')).toBe('HIT');
					}
				});
			}
		}
	});

	describe('Purges cache when item is mutated with Referer header', () => {
		for (const instance of instances) {
			for (const collection of ['first', 'ignored']) {
				test(`${instance.env.PUBLIC_URL} ${collection}`, async () => {
					const referer = `${instance.env.PUBLIC_URL}/admin/content/${collection}/`;

					const api = createDirectus<Schema>(`http://localhost:${instance.apis[0].port}`)
						.with(rest())
						.with(staticToken('admin'));

					await api.request(clearCache());

					await fetch(`http://localhost:${instance.apis[0].port}/items/${collection}`, {
						headers: {
							Referer: referer,
							Authorization: 'Bearer admin',
						},
					});

					await fetch(`http://localhost:${instance.apis[0].port}/items/${collection}`, {
						method: 'POST',
						body: JSON.stringify({
							text: randomUUID(),
						}),
						headers: {
							Referer: referer,
							Authorization: 'Bearer admin',
						},
					});

					const response = await fetch(`http://localhost:${instance.apis[0].port}/items/${collection}`, {
						headers: {
							Referer: referer,
							Authorization: 'Bearer admin',
						},
					});

					// Assert
					expect(response.status).toBe(200);
					expect(response.headers.get('x-cache-status')).toBe('MISS');
				});
			}
		}
	});

	describe('Purges cache when item is mutated with an external Referer header', () => {
		for (const instance of instances) {
			for (const collection of ['first', 'ignored'] as const) {
				test(`${instance.env.PUBLIC_URL} ${collection}`, async () => {
					const referer = `http://external.com/admin/content/${collection}`;

					const api = createDirectus<Schema>(`http://localhost:${instance.apis[0].port}`)
						.with(rest())
						.with(staticToken('admin'));

					await api.request(clearCache());

					await fetch(`http://localhost:${instance.apis[0].port}/items/${collection}`, {
						headers: {
							Referer: referer,
							Authorization: 'Bearer admin',
						},
					});

					await fetch(`http://localhost:${instance.apis[0].port}/items/${collection}`, {
						method: 'POST',
						body: JSON.stringify({
							text: randomUUID(),
						}),
						headers: {
							Referer: referer,
							Authorization: 'Bearer admin',
						},
					});

					const response = await fetch(`http://localhost:${instance.apis[0].port}/items/${collection}`, {
						headers: {
							Referer: referer,
							Authorization: 'Bearer admin',
						},
					});

					// Assert
					if (collection === 'first') {
						const expectedCacheStatus = (instance.env as any)['CACHE_AUTO_PURGE'] === 'true' ? 'MISS' : 'HIT';

						expect(response.status).toBe(200);
						expect(response.headers.get('x-cache-status')).toBe(expectedCacheStatus);
					} else {
						expect(response.status).toBe(200);
						expect(response.headers.get('x-cache-status')).toBe('HIT');
					}
				});
			}
		}
	});
}
