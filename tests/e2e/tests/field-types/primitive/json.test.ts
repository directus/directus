import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

test(`valid json (object)`, async () => {
	const result = await api.request(
		createItem(collections.fields, {
			json: { hello: 'world' },
		}),
	);

	expect(result.json).toEqual({ hello: 'world' });
});

test(`valid json (string)`, async () => {
	const result = await api.request(
		createItem(collections.fields, {
			json: JSON.stringify({ hello: 'world' }),
		}),
	);

	expect(result.json).toEqual({ hello: 'world' });
});

test(`invalid json (unparseable string)`, async () => {
	await expect(() =>
		api.request(
			createItem(collections.fields, {
				json: '{not valid json',
			}),
		),
	).rejects.toMatchObject({
		errors: [{ extensions: { code: 'INVALID_PAYLOAD' } }],
	});
});
