import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { test, expect } from 'vitest';
import type { Database } from '@directus/sandbox';
import { useSnapshot } from '@utils/useSnapshot.js';

import type { Schema } from './schema.js';
import { join } from 'path';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

const database = process.env['DATABASE'] as Database;

for (const bool of [true, false]) {
	test(`valid boolean ${bool}`, async () => {
		const result = await api.request(
			createItem(collections.fields, {
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
				createItem(collections.fields, {
					boolean: 'test',
				}),
			),
		).rejects.toThrowError();
	});
}
