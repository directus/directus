import { sandbox } from '@directus/sandbox';
import { clearCache, createDirectus, deleteCollection, readFields, rest, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { useSnapshot } from '@utils/useSnapshot.js';
import { describe, expect, test } from 'vitest';
import type { Schema } from './schema.js';

const newCollectionName = 'schema-caching-test';

const all = process.env['ALL'] === 'true';

if (!all)
	describe('Schema Caching Tests', () => {
		describe('GET /collections/:collection', () => {
			test('schema change propagates across nodes using messenger', { timeout: 120_000 }, async () => {
				const directus = await sandbox(database, {
					instances: '2',
					inspect: false,
					silent: true,
					cache: true,
					extras: {
						redis: true,
					},
					env: {
						CACHE_AUTO_PURGE: 'true',
						CACHE_STORE: 'memory',
					},
					docker: {
						suffix: getUID(),
					},
				});

				const api1 = createDirectus<Schema>(`http://localhost:${directus.apis[0].port}`)
					.with(rest())
					.with(staticToken('admin'));

				const api2 = createDirectus<Schema>(`http://localhost:${directus.apis[1]!.port}`)
					.with(rest())
					.with(staticToken('admin'));

				const { collections } = await useSnapshot<Schema>(api1);

				await api1.request(clearCache());
				await api1.request(readFields());
				await api2.request(clearCache());
				await api2.request(readFields());

				// Action
				const responseBefore = await fetch(
					`http://localhost:${directus.apis[0].port}/collections/${newCollectionName}`,
					{
						headers: {
							Authorization: 'Bearer admin',
						},
					},
				);

				const responseBefore2 = await fetch(
					`http://localhost:${directus.apis[1]!.port}/collections/${newCollectionName}`,
					{
						headers: {
							Authorization: 'Bearer admin',
						},
					},
				);

				api1.request(deleteCollection(collections.cache_delete));

				const responseAfter = await fetch(
					`http://localhost:${directus.apis[0].port}/collections/${newCollectionName}`,
					{
						headers: {
							Authorization: 'Bearer admin',
						},
					},
				);

				const responseAfter2 = await fetch(
					`http://localhost:${directus.apis[1]!.port}/collections/${newCollectionName}`,
					{
						headers: {
							Authorization: 'Bearer admin',
						},
					},
				);

				// Assert
				expect(responseBefore.status).toBe(200);
				expect(responseBefore2.status).toBe(200);
				expect(responseAfter.status).toBe(403);
				expect(responseAfter2.status).toBe(403);
			});

			test('schema change does not propagate across nodes without messenger', { timeout: 120_000 }, async () => {
				const directus = await sandbox(database, {
					instances: '2',
					inspect: false,
					silent: true,
					cache: true,
					extras: {
						redis: false,
					},
					env: {
						CACHE_AUTO_PURGE: 'true',
						CACHE_STORE: 'memory',
					},
					docker: {
						suffix: getUID(),
					},
				});

				// Setup

				const api1 = createDirectus<Schema>(`http://localhost:${directus.apis[0].port}`)
					.with(rest())
					.with(staticToken('admin'));

				const api2 = createDirectus<Schema>(`http://localhost:${directus.apis[1]!.port}`)
					.with(rest())
					.with(staticToken('admin'));

				const { collections } = await useSnapshot<Schema>(api1);

				await api1.request(clearCache());
				await api1.request(readFields());
				await api2.request(clearCache());
				await api2.request(readFields());

				// Action
				const responseBefore = await fetch(
					`http://localhost:${directus.apis[0].port}/collections/${newCollectionName}`,
					{
						headers: {
							Authorization: 'Bearer admin',
						},
					},
				);

				const responseBefore2 = await fetch(
					`http://localhost:${directus.apis[1]!.port}/collections/${newCollectionName}`,
					{
						headers: {
							Authorization: 'Bearer admin',
						},
					},
				);

				api1.request(deleteCollection(collections.cache_delete));

				const responseAfter = await fetch(
					`http://localhost:${directus.apis[0].port}/collections/${newCollectionName}`,
					{
						headers: {
							Authorization: 'Bearer admin',
						},
					},
				);

				const responseAfter2 = await fetch(
					`http://localhost:${directus.apis[1]!.port}/collections/${newCollectionName}`,
					{
						headers: {
							Authorization: 'Bearer admin',
						},
					},
				);

				// Assert
				expect(responseBefore.status).toBe(200);
				expect(responseBefore2.status).toBe(200);
				expect(responseAfter.status).toBe(403);
				expect(responseAfter2.status).toBe(200);
			});
		});
	});
