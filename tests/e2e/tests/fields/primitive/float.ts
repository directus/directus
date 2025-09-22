import { createItem } from '@directus/sdk';
import { test, expect } from 'vitest';
import type { Api, Collections } from './primitive.test.js';
import type { Database } from '@directus/sandbox';

export function testFloat(api: Api, c: Collections) {
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
