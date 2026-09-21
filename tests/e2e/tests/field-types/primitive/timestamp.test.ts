import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
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

test(`invalid timestamp (non-string)`, async () => {
	await expect(() =>
		api.request(
			createItem(collections.fields, {
				timestamp: 12345,
			}),
		),
	).rejects.toMatchObject({
		errors: [{ extensions: { code: 'INVALID_PAYLOAD' } }],
	});
});
