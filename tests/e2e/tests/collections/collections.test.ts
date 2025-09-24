import {
	createDirectus,
	staticToken,
	rest,
	createCollection,
	readCollection,
	updateCollection,
	deleteCollection,
} from '@directus/sdk';

import { expect, test } from 'vitest';
import { randomUUID } from 'node:crypto';
import { port } from '@utils/constants.js';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

const collectionName = `collections_${randomUUID()}`;

test('crud on a collection', async () => {
	const create = await api.request(
		createCollection({
			collection: collectionName,
			fields: [
				{
					field: 'id',
					type: 'integer',
					meta: { hidden: true, interface: 'input', readonly: true },
					schema: { is_primary_key: true, has_auto_increment: true },
				},
			],
			schema: {},
			meta: { singleton: false },
		}),
	);

	expect(create).toBeDefined();

	const read = await api.request(readCollection(collectionName));

	expect(read).toMatchObject({
		collection: collectionName,
		meta: {
			accountability: 'all',
			archive_app_filter: true,
			archive_field: null,
			archive_value: null,
			collapse: 'open',
			collection: collectionName,
			color: null,
			display_template: null,
			group: null,
			hidden: false,
			icon: null,
			item_duplication_fields: null,
			note: null,
			preview_url: null,
			singleton: false,
			sort: null,
			sort_field: null,
			translations: null,
			unarchive_value: null,
			versioning: false,
		},
		schema: {
			name: collectionName,
		},
	});

	const update = await api.request(
		updateCollection(collectionName, {
			meta: {
				note: 'Updated',
			},
		}),
	);

	expect(update).toBeDefined();

	const del = await api.request(deleteCollection(collectionName));

	expect(del).toBeNull();
});
