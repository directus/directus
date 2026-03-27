import { createItem } from '@directus/sdk';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/useSnapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

for (const timestamp of ['2020-01-01', '2001-12-24']) {
	test(`valid timestamp ${timestamp}`, async () => {
		const result = await api.request(
			createItem(collections.fields, {
				timestamp,
			}),
		);

		expect(result.timestamp).toBeOneOf([`${timestamp}T00:00:00.000Z`, `${timestamp}T00:00:00`]);
	});
}

test(`invalid timestamp`, async () => {
	await expect(() =>
		api.request(
			createItem(collections.fields, {
				timestamp: 'test',
			}),
		),
	).rejects.toThrowError();
});
