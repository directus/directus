import { randomUUID } from 'node:crypto';
import {
	aggregate,
	createCollection,
	createDirectus,
	createItem,
	createItems,
	createRelation,
	createUser,
	deleteCollection,
	readItems,
	rest,
	staticToken,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { afterAll, expect, test } from 'vitest';

const api = createDirectus<any>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

const collection = `case_when_${randomUUID().replaceAll('-', '')}`;
const token = randomUUID();

afterAll(async () => {
	await api.request(deleteCollection(collection));
});

await api.request(
	createCollection({
		collection,
		fields: [
			{
				field: 'id',
				type: 'integer',
				meta: { hidden: true, interface: 'input', readonly: true },
				schema: { is_primary_key: true, has_auto_increment: true },
			},
			{
				field: 'user_created',
				type: 'uuid',
				meta: { special: ['user-created'], interface: 'select-dropdown-m2o', readonly: true, hidden: true },
				schema: {},
			},
			{
				field: 'date_created',
				type: 'timestamp',
				meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true },
				schema: {},
			},
		],
		schema: {},
		meta: { singleton: false },
	}),
);

await api.request(
	createRelation({
		collection,
		field: 'user_created',
		related_collection: 'directus_users',
		schema: {},
		meta: {},
	}),
);

// The read rule is item scoped, which is what forces the query to be rewritten with CASE WHEN
const user = await api.request(
	createUser({
		first_name: 'Case When',
		token,
		policies: [
			{
				policy: {
					name: `${collection} policy`,
					app_access: true,
					admin_access: false,
					permissions: [
						{
							collection,
							action: 'read',
							permissions: { _and: [{ user_created: { id: { _eq: '$CURRENT_USER' } } }] },
							validation: null,
							fields: ['id', 'user_created', 'date_created'],
							presets: null,
						},
						{
							collection,
							action: 'create',
							permissions: null,
							validation: null,
							fields: ['*'],
							presets: null,
						},
					],
				},
			},
		],
	} as any),
);

const userApi = createDirectus<any>(`http://localhost:${port}`).with(rest()).with(staticToken(token));

// One item owned by the admin, two owned by the scoped user
await api.request(createItem(collection, {}));
await userApi.request(createItems(collection, [{}, {}]));

test('an item scoped read rule only returns the items the user created', async () => {
	const result = await userApi.request(readItems(collection));

	expect(result.length).toBe(2);
});

test('grouping by a field returns one row per distinct value, not one per permission match', async () => {
	const result = await userApi.request(aggregate(collection, { groupBy: ['user_created'], aggregate: {} } as any));

	expect(result.length).toBe(1);
});

test('grouping by a function field aggregates over the permitted items only', async () => {
	const result = await userApi.request(
		aggregate(collection, { groupBy: ['day(date_created)'], aggregate: { count: '*' } } as any),
	);

	expect(result.length).toBe(1);
	expect(Number((result[0] as any).count)).toBe(2);
});

test('a filter comparing a string column against a uuid column does not error', async () => {
	// directus_comments.item is a string while directus_users.id is a uuid, so the
	// generated CASE WHEN has to compare two different column types
	const result = await userApi.request(
		aggregate('directus_comments', {
			query: {
				filter: { _and: [{ collection: { _eq: 'directus_users' } }, { item: { _eq: user.id } }] },
			},
			aggregate: { count: ['id'] },
		} as any),
	);

	expect(Number((result[0] as any).count.id)).toBe(0);
});
