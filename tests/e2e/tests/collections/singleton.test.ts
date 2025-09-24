import {
	createCollection,
	createDirectus,
	createItem,
	readSingleton,
	rest,
	staticToken,
	updateSingleton,
} from '@directus/sdk';
import { port } from '@utils/constants.js';

import { randomUUID } from 'node:crypto';
import { expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

const collectionName = `singleton_${randomUUID()}`;

test('singleton', async () => {
	const createCol = await api.request(
		createCollection({
			collection: collectionName,
			fields: [
				{
					field: 'id',
					type: 'integer',
					meta: { hidden: true, interface: 'input', readonly: true },
					schema: { is_primary_key: true, has_auto_increment: true },
				},
				{
					field: 'title',
					type: 'string',
				},
			],
			schema: {},
			meta: { singleton: true },
		}),
	);

	expect(createCol).toBeDefined();

	const firstRead = await api.request(readSingleton(collectionName));

	expect(firstRead).toMatchObject({
		id: null,
	});

	const create = await api.request(updateSingleton(collectionName, { title: 'Hello Singleton' }));

	expect(create).toBeDefined();

	const secondRead = await api.request(readSingleton(collectionName));

	expect(secondRead).toMatchObject({
		id: expect.anything(),
		title: 'Hello Singleton',
	});

	await expect(() => api.request(createItem(collectionName, { title: 'Nope' }))).rejects.toThrowError();
});
