import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { useSnapshot } from '../../../utils/use-snapshot';
import { Schema } from './schema';
import { join } from 'path';
import { expect, test } from 'vitest';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const collections = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

test(`relational`, async () => {
	const result = await api.request(
		createItem(collections.articles, {
			title: 'Hi',
		}),
	);

	expect(result.title).toEqual('Hi');
});
