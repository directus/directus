import { createItem } from '@directus/sdk';
import { test, expect } from 'vitest';
import type { Api, Collections } from './primitive.test.js';
import type { Database } from '@directus/sandbox';

export function testString(api: Api, c: Collections) {
	const database = process.env['DATABASE'] as Database;

	test(`valid string`, async () => {
		const result = await api.request(
			createItem(c.fields, {
				string: 'Hi',
			}),
		);

		expect(result.string).toEqual('Hi');
	});

	test(`max string`, async () => {
		const result = await api.request(
			createItem(c.fields, {
				string: '0'.repeat(255),
			}),
		);

		expect(result.string).toEqual('0'.repeat(255));
	});

	if (database !== 'sqlite') {
		test(`max string overflow`, async () => {
			await expect(
				async () =>
					await api.request(
						createItem(c.fields, {
							string: '0'.repeat(256),
						}),
					),
			).rejects.toThrowError();
		});
	}
}
