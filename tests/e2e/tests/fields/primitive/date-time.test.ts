import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { useSnapshot } from '@utils/useSnapshot.js';
import { expect, test } from 'vitest';

import { join } from 'path';
import type { Schema } from './schema.js';
import { port } from '@utils/constants.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

for (const dateTime of ['2020-01-01T10:10:01', '2001-12-24T23:59:59']) {
	test(`valid date_time ${dateTime}`, async () => {
		const result = await api.request(
			createItem(collections.fields, {
				date_time: dateTime,
			}),
		);

		expect(result.date_time).toBe(dateTime);
	});
}

test(`invalid date_time`, async () => {
	await expect(() =>
		api.request(
			createItem(collections.fields, {
				date_time: 'test',
			}),
		),
	).rejects.toThrowError();
});
