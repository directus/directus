import { createItem, DirectusClient, RestClient } from '@directus/sdk';
import { test, expect } from 'vitest';
import { Schema } from '../primitive.test';

export function testDateTime(api: DirectusClient<Schema> & RestClient<Schema>) {
	for (const dateTime of ['2020-01-01T10:10:01', '2001-12-24T23:59:59']) {
		test(`valid date_time ${dateTime}`, async () => {
			const result = await api.request(
				createItem('fields', {
					date_time: dateTime,
				}),
			);

			expect(result.date_time).toBe(dateTime);
		});
	}

	test(`invalid date_time`, async () => {
		await expect(() =>
			api.request(
				createItem('fields', {
					date_time: 'test',
				}),
			),
		).rejects.toThrowError();
	});
}
