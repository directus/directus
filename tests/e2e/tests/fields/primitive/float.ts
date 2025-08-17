import { createItem, DirectusClient, RestClient } from '@directus/sdk';
import { test, expect } from 'vitest';
import { Collections } from './primitive.test';
import { Database } from '@directus/sandbox';
import { Schema } from './schema';

export function testFloat(api: DirectusClient<Schema> & RestClient<Schema>, c: Collections) {
	const database = process.env['DATABASE'] as Database;

	for (const n of [0.0, -1.1, 0.1, 100.001]) {
		test(`valid float ${n}`, async () => {
			const result = await api.request(
				createItem(c.fields, {
					float: n,
				}),
			);

			expect(result.float).toEqual(n);
		});
	}

	if (database !== 'sqlite') {
		test(`invalid float`, async () => {
			await expect(() =>
				api.request(
					createItem(c.fields, {
						float: 'test',
					}),
				),
			).rejects.toThrowError();
		});
	}
}
