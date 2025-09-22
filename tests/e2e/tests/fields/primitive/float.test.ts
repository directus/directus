import type { Database } from '@directus/sandbox';
import { createItem } from '@directus/sdk';
import { expect, test } from 'vitest';

import { createDirectus, rest, staticToken } from '@directus/sdk';
import { useSnapshot } from '@utils/useSnapshot.js';

import { join } from 'path';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));
const database = process.env['DATABASE'] as Database;

for (const n of [0.0, -1.1, 0.1, 100.001]) {
	test(`valid float ${n}`, async () => {
		const result = await api.request(
			createItem(collections.fields, {
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
				createItem(collections.fields, {
					float: 'test',
				}),
			),
		).rejects.toThrowError();
	});
}
