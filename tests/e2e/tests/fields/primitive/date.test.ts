import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { useSnapshot } from '@utils/useSnapshot.js';
import { expect, test } from 'vitest';

import { join } from 'path';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

for (const date of ['2020-01-01', '2001-12-24']) {
	test(`valid date ${date}`, async () => {
		const result = await api.request(
			createItem(collections.fields, {
				date,
			}),
		);

		expect(result.date).toBe(date);
	});
}

test(`invalid date`, async () => {
	await expect(() =>
		api.request(
			createItem(collections.fields, {
				date: 'test',
			}),
		),
	).rejects.toThrowError();
});
