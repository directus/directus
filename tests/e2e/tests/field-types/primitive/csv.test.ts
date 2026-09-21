import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

test(`valid csv (array)`, async () => {
	const result = await api.request(
		createItem(collections.fields, {
			csv: ['a', 'b', 'c'],
		}),
	);

	expect(result.csv).toEqual(['a', 'b', 'c']);
});

test(`valid csv (string)`, async () => {
	const result = await api.request(
		createItem(collections.fields, {
			csv: 'a,b,c',
		}),
	);

	expect(result.csv).toEqual(['a', 'b', 'c']);
});

test(`invalid csv (non-array, non-string)`, async () => {
	await expect(() =>
		api.request(
			createItem(collections.fields, {
				csv: 12345,
			}),
		),
	).rejects.toMatchObject({
		errors: [{ extensions: { code: 'INVALID_PAYLOAD' } }],
	});
});
