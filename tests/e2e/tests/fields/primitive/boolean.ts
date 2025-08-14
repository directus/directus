import { createItem, DirectusClient, RestClient } from '@directus/sdk';
import { test, expect } from 'vitest';
import { Schema } from '../primitive.test';
import { Database } from '@directus/sandbox';

export function testBoolean(api: DirectusClient<Schema> & RestClient<Schema>) {
	const database = process.env['DATABASE'] as Database;

	for (const bool of [true, false]) {
		test(`valid boolean ${bool}`, async () => {
			const result = await api.request(
				createItem('fields', {
					boolean: bool,
				}),
			);

			expect(result.boolean).toBe(bool);
		});
	}

	if (database !== 'sqlite') {
		test(`invalid value for boolean`, async () => {
			await expect(() =>
				api.request(
					createItem('fields', {
						boolean: 'test',
					}),
				),
			).rejects.toThrowError();
		});
	}
}
