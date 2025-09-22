import { createItem } from '@directus/sdk';
import { test, expect } from 'vitest';
import type { Api, Collections } from './primitive.test.js';

export function testDate(api: Api, c: Collections) {
	for (const date of ['2020-01-01', '2001-12-24']) {
		test(`valid date ${date}`, async () => {
			const result = await api.request(
				createItem(c.fields, {
					date,
				}),
			);

			expect(result.date).toBe(date);
		});
	}

	test(`invalid date`, async () => {
		await expect(() =>
			api.request(
				createItem(c.fields, {
					date: 'test',
				}),
			),
		).rejects.toThrowError();
	});
}
