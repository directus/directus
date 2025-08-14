import { createItem, DirectusClient, RestClient } from '@directus/sdk';
import { test, expect } from 'vitest';
import { Schema } from '../primitive.test';
import { getHelper } from '../../../utils/helpers';
import { Database } from '@directus/sandbox';

export function testFloat(api: DirectusClient<Schema> & RestClient<Schema>) {
	const database = process.env['DATABASE'] as Database;
	const { integer } = getHelper(database);

	for (const n of [0.0, -1.1, 0.1, 100.001]) {
		test(`valid float ${n}`, async () => {
			const result = await api.request(
				createItem('fields', {
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
					createItem('fields', {
						float: 'test',
					}),
				),
			).rejects.toThrowError();
		});
	}
}
