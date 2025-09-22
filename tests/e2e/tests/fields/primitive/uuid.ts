import { createItem } from '@directus/sdk';
import { test, expect } from 'vitest';
import type { Api, Collections } from './primitive.test.js';
import type { Database } from '@directus/sandbox';

export function testUUID(api: Api, c: Collections) {
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
