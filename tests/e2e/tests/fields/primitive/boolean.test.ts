import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { useSnapshot } from '@utils/useSnapshot.js';
import { expect, test } from 'vitest';

import { database, port } from '@utils/constants.js';
import { join } from 'path';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

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
