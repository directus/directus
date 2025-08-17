import { createItem, DirectusClient, RestClient } from '@directus/sdk';
import { test, expect } from 'vitest';
import { Database } from '@directus/sandbox';
import { Collections } from './primitive.test';
import { Schema } from './schema';

export function testUUID(api: DirectusClient<Schema> & RestClient<Schema>, c: Collections) {
	const database = process.env['DATABASE'] as Database;

	for (const uuid of [crypto.randomUUID()]) {
		test(`valid uuid ${uuid}`, async () => {
			const result = await api.request(
				createItem(c.fields, {
					uuid,
				}),
			);

			expect(result.uuid.toLowerCase()).toBe(uuid);
		});
	}

	if (database === 'postgres' || database === 'cockroachdb' || database === 'mssql') {
		test(`invalid uuid`, async () => {
			await expect(() =>
				api.request(
					createItem(c.fields, {
						uuid: 'test',
					}),
				),
			).rejects.toThrowError();
		});
	}
}
