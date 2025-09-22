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

for (const uuid of [crypto.randomUUID()]) {
	test(`valid uuid ${uuid}`, async () => {
		const result = await api.request(
			createItem(collections.fields, {
				uuid,
			}),
		);

		expect(result.uuid.toLowerCase()).toBe(uuid);
	});
}

if (database === 'postgres' || database === 'cockroachdb' || database === 'mssql') {
	test(`invalid uuid`, async () => {
		await expect(() =>
			api.request(
				createItem(collections.fields, {
					uuid: 'test',
				}),
			),
		).rejects.toThrowError();
	});
}
