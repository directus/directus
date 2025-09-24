import { sandbox } from '@directus/sandbox';
import { clearCache, createDirectus, deleteCollection, readFields, rest, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { useSnapshot } from '@utils/useSnapshot.js';
import getPort from 'get-port';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const newCollectionName = 'schema-caching-test';

describe('Schema Caching Tests', () => {
	describe('GET /collections/:collection', () => {
		test('schema change propagates across nodes using messenger', async () => {
			const directus = await sandbox(database, {
				port: await getPort(),
				instances: '2',
				killPorts: true,
				inspect: false,
				cache: true,
				extras: {
					redis: true,
				},
				env: {
					CACHE_AUTO_PURGE: 'true',
					CACHE_STORE: 'memory',
				},
				docker: {
					basePort: getPort,
					name: 'sandbox-horrizontal-schema-cache',
				},
			});

			const api1 = createDirectus<Schema>(`http://localhost:${directus.env.PORT}`)
				.with(rest())
				.with(staticToken('admin'));

			const api2 = createDirectus<Schema>(`http://localhost:${Number(directus.env.PORT) + 1}`)
				.with(rest())
				.with(staticToken('admin'));

			const { collections } = await useSnapshot<Schema>(api1, join(import.meta.dirname, 'snapshot.json'));

			await api1.request(clearCache());
			await api1.request(readFields());
			await api2.request(clearCache());
			await api2.request(readFields());

			// Action
			const responseBefore = await fetch(`http://localhost:${directus.env.PORT}/collections/${newCollectionName}`, {
				headers: {
					Authorization: 'Bearer admin',
				},
			});

			const responseBefore2 = await fetch(
				`http://localhost:${Number(directus.env.PORT) + 1}/collections/${newCollectionName}`,
				{
					headers: {
						Authorization: 'Bearer admin',
					},
				},
			);

			api1.request(deleteCollection(collections.cache_delete));

			const responseAfter = await fetch(`http://localhost:${directus.env.PORT}/collections/${newCollectionName}`, {
				headers: {
					Authorization: 'Bearer admin',
				},
			});

			const responseAfter2 = await fetch(
				`http://localhost:${Number(directus.env.PORT) + 1}/collections/${newCollectionName}`,
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

		test('schema change does not propagate across nodes without messenger', async () => {
			const directus = await sandbox(database, {
				port: await getPort(),
				instances: '2',
				killPorts: true,
				inspect: false,
				cache: true,
				extras: {
					redis: false,
				},
				env: {
					CACHE_AUTO_PURGE: 'true',
					CACHE_STORE: 'memory',
				},
				docker: {
					basePort: getPort,
					name: 'sandbox-horrizontal-schema-cache',
				},
			});

			// Setup

			const api1 = createDirectus<Schema>(`http://localhost:${directus.env.PORT}`)
				.with(rest())
				.with(staticToken('admin'));

			const api2 = createDirectus<Schema>(`http://localhost:${Number(directus.env.PORT) + 1}`)
				.with(rest())
				.with(staticToken('admin'));

			const { collections } = await useSnapshot<Schema>(api1, join(import.meta.dirname, 'snapshot.json'));

			await api1.request(clearCache());
			await api1.request(readFields());
			await api2.request(clearCache());
			await api2.request(readFields());

			// Action
			const responseBefore = await fetch(`http://localhost:${directus.env.PORT}/collections/${newCollectionName}`, {
				headers: {
					Authorization: 'Bearer admin',
				},
			});

			const responseBefore2 = await fetch(
				`http://localhost:${Number(directus.env.PORT) + 1}/collections/${newCollectionName}`,
				{
					headers: {
						Authorization: 'Bearer admin',
					},
				},
			);

			api1.request(deleteCollection(collections.cache_delete));

			const responseAfter = await fetch(`http://localhost:${directus.env.PORT}/collections/${newCollectionName}`, {
				headers: {
					Authorization: 'Bearer admin',
				},
			});

			const responseAfter2 = await fetch(
				`http://localhost:${Number(directus.env.PORT) + 1}/collections/${newCollectionName}`,
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
