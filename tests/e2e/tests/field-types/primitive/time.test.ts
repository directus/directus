import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

for (const time of ['10:10:01', '23:59:59']) {
	test(`valid time ${time}`, async () => {
		const result = await api.request(
			createItem(collections.fields, {
				time,
			}),
		);

		expect(result.time).toBe(time);
	});
}

test(`invalid time`, async () => {
	await expect(() =>
		api.request(
			createItem(collections.fields, {
				time: 'test',
			}),
		),
	).rejects.toThrowError();
});

test(`invalid time (non-string)`, async () => {
	await expect(() =>
		api.request(
			createItem(collections.fields, {
				time: 12345,
			}),
		),
	).rejects.toMatchObject({
		errors: [{ extensions: { code: 'INVALID_PAYLOAD' } }],
	});
});
