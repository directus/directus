import { createItem } from '@directus/sdk';
import { expect, test } from 'vitest';

import { createDirectus, rest, staticToken } from '@directus/sdk';
import { useSnapshot } from '@utils/useSnapshot.js';

import { database, port } from '@utils/constants.js';
import { join } from 'path';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

test(`valid string`, async () => {
	const result = await api.request(
		createItem(collections.fields, {
			string: 'Hi',
		}),
	);

	expect(result.string).toEqual('Hi');
});

test(`max string`, async () => {
	const result = await api.request(
		createItem(collections.fields, {
			string: '0'.repeat(255),
		}),
	);

	expect(result.string).toEqual('0'.repeat(255));
});

if (database !== 'sqlite') {
	test(`max string overflow`, async () => {
		await expect(
			async () =>
				await api.request(
					createItem(collections.fields, {
						string: '0'.repeat(256),
					}),
				),
		).rejects.toThrowError();
	});
}
