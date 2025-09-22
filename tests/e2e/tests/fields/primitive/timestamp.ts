import { createItem } from '@directus/sdk';
import { test, expect } from 'vitest';
import type { Api, Collections } from './primitive.test.js';

export function testTimestamp(api: Api, c: Collections) {
	for (const timestamp of ['2020-01-01', '2001-12-24']) {
		test(`valid timestamp ${timestamp}`, async () => {
			const result = await api.request(
				createItem(c.fields, {
					timestamp,
				}),
			);

			expect(result.timestamp).toBeOneOf([`${timestamp}T00:00:00.000Z`, `${timestamp}T00:00:00`]);
		});
	}

	test(`invalid timestamp`, async () => {
		await expect(() =>
			api.request(
				createItem(c.fields, {
					timestamp: 'test',
				}),
			),
		).rejects.toThrowError();
	});
}
