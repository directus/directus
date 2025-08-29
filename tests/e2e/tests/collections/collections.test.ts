import { createDirectus, staticToken, rest, createCollection } from '@directus/sdk';

import { test } from 'vitest';
import { Schema } from '../fields/relational/schema';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));

test('creating a collection', async () => {
	await api.request(
		createCollection({
			collection: 'test',
			fields: [
				{
					field: 'id',
					type: 'integer',
				},
			],
		}),
	);
});
