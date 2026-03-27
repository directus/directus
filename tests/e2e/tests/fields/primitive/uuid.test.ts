import { createItem } from '@directus/sdk';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { database, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/useSnapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

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
