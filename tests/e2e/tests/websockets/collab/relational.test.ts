import { randomUUID } from 'node:crypto';
import { createDirectus, createItem, rest, staticToken, updateSettings } from '@directus/sdk';
import { openCollab } from '@utils/collab.js';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { afterAll, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { createRestrictedUser, type Rule } from './users.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

await api.request(updateSettings({ collaborative_editing_enabled: true } as any));

const { collections } = await useSnapshot<Schema>(api);

const clients: { close: () => void }[] = [];

afterAll(() => {
	for (const client of clients) client.close();
});

async function client(token = 'admin') {
	const collab = await openCollab(port, token);
	clients.push(collab);
	return collab;
}

/** Full access to the parent collection, so only the related collection's rules are under test. */
const PARENT_RULES: Rule[] = [
	{ collection: collections.relational, action: 'read', fields: ['*'] },
	{ collection: collections.relational, action: 'update', fields: ['*'] },
];

/**
 * Every relation kind carries a draft in its own shape, but the same rule applies to all of them:
 * a related item in a draft is trimmed to the fields the recipient may read.
 */
const RELATIONS = [
	{
		kind: 'm2o',
		field: 'm2o_related',
		related: () => collections.m2o,
		changes: (id: string) => ({ id, name: 'Related', field_a: 'New A', field_b: 'New B' }),
		nested: (changes: any) => changes,
	},
	{
		kind: 'o2m',
		field: 'o2m_related',
		related: () => collections.o2m,
		changes: () => ({
			create: [{ id: randomUUID(), name: 'Related', field_a: 'New A', field_b: 'New B' }],
			update: [],
			delete: [],
		}),
		nested: (changes: any) => changes?.create?.[0],
	},
	{
		kind: 'm2m',
		field: 'm2m_related',
		related: () => collections.m2m,
		junction: () => collections.relational_m2m,
		changes: (id: string) => ({
			create: [{ m2m_id: { id, name: 'Related', field_a: 'New A', field_b: 'New B' } }],
			update: [],
			delete: [],
		}),
		nested: (changes: any) => changes?.create?.[0]?.m2m_id,
	},
	{
		kind: 'm2a',
		field: 'a2o_items',
		related: () => collections.a2o,
		junction: () => collections.relational_a2o,
		changes: (id: string) => ({
			create: [{ collection: collections.a2o, item: { id, name: 'Related', field_a: 'New A', field_b: 'New B' } }],
			update: [],
			delete: [],
		}),
		nested: (changes: any) => changes?.create?.[0]?.item,
	},
] as const;

/** An admin and a restricted client sharing a room on a fresh parent item. */
async function shareRoom(permissions: Rule[]) {
	const main = await api.request(createItem(collections.relational, { name: 'Main Item' } as any));

	const admin = await client();
	const viewer = await client(await createRestrictedUser(api as any, permissions));

	const init = await admin.join(collections.relational, main.id!);
	await viewer.join(collections.relational, main.id!);
	await admin.waitFor('join');

	return { admin, viewer, room: init.room as string, main };
}

for (const relation of RELATIONS) {
	const { kind, field, related, changes, nested } = relation;

	// A junction has to be readable before anything behind it can be
	const junction = 'junction' in relation ? [{ collection: relation.junction(), action: 'read' as const, fields: ['*'] }] : []; // prettier-ignore

	test(`a ${kind} draft is trimmed to the fields the recipient may read`, async () => {
		const { admin, viewer, room } = await shareRoom([
			...PARENT_RULES,
			...junction,
			{ collection: related(), action: 'read', fields: ['id', 'name', 'field_a'] },
		]);

		admin.collab({ action: 'focus', room, field });
		await viewer.waitFor('focus', (message) => message.field === field);

		admin.collab({ action: 'update', room, field, changes: changes(randomUUID()) });

		const update = await viewer.waitFor('update', (message) => message.field === field);

		expect(nested(update.changes)).toHaveProperty('field_a', 'New A');
		expect(nested(update.changes)).not.toHaveProperty('field_b');
	});

	test(`a ${kind} draft is withheld entirely when the recipient cannot read the collection`, async () => {
		const { admin, viewer, room } = await shareRoom(PARENT_RULES);

		admin.collab({ action: 'focus', room, field });
		await viewer.waitFor('focus', (message) => message.field === field);

		admin.collab({ action: 'update', room, field, changes: changes(randomUUID()) });

		expect(await viewer.quiet('update', (message) => message.field === field)).toBe(true);
	});
}

test('a nested o2m draft is trimmed at every level', async () => {
	const { admin, viewer, room } = await shareRoom([
		...PARENT_RULES,
		{ collection: collections.o2m, action: 'read', fields: ['id', 'name', 'field_a', 'deep_o2m_related'] },
		{ collection: collections.deep, action: 'read', fields: ['id', 'name', 'field_a'] },
	]);

	admin.collab({ action: 'focus', room, field: 'o2m_related' });
	await viewer.waitFor('focus', (message) => message.field === 'o2m_related');

	admin.collab({
		action: 'update',
		room,
		field: 'o2m_related',
		changes: {
			create: [
				{
					id: randomUUID(),
					name: 'Child',
					field_a: 'Child A',
					field_b: 'Child B',
					deep_o2m_related: {
						create: [{ id: randomUUID(), name: 'Grandchild', field_a: 'Deep A', field_b: 'Deep B' }],
						update: [],
						delete: [],
					},
				},
			],
			update: [],
			delete: [],
		},
	});

	const update = await viewer.waitFor('update', (message) => message.field === 'o2m_related');

	const child = update.changes?.create?.[0];
	const grandchild = child?.deep_o2m_related?.create?.[0];

	expect(child).toHaveProperty('field_a', 'Child A');
	expect(child).not.toHaveProperty('field_b');
	expect(grandchild).toHaveProperty('field_a', 'Deep A');
	expect(grandchild).not.toHaveProperty('field_b');
});

test('an m2a draft keeps the members the recipient may read and drops the rest', async () => {
	const { admin, viewer, room } = await shareRoom([
		...PARENT_RULES,
		{ collection: collections.relational_a2o, action: 'read', fields: ['*'] },
		{ collection: collections.a2o, action: 'read', fields: ['id', 'name', 'field_a'] },
	]);

	admin.collab({ action: 'focus', room, field: 'a2o_items' });
	await viewer.waitFor('focus', (message) => message.field === 'a2o_items');

	admin.collab({
		action: 'update',
		room,
		field: 'a2o_items',
		changes: {
			create: [
				{
					collection: collections.a2o,
					item: { id: randomUUID(), name: 'Allowed', field_a: 'Allowed A', field_b: 'Allowed B' },
				},
				{
					// The recipient has no read rule for this member's collection
					collection: collections.m2o,
					item: { id: randomUUID(), name: 'Hidden', field_a: 'Hidden A', field_b: 'Hidden B' },
				},
			],
			update: [],
			delete: [],
		},
	});

	const update = await viewer.waitFor('update', (message) => message.field === 'a2o_items');

	const members = update.changes?.create ?? [];

	// Both junction rows survive, but the member the recipient may not read carries no item
	expect(members).toHaveLength(2);

	const allowed = members.find((member: any) => member.collection === collections.a2o);
	const hidden = members.find((member: any) => member.collection === collections.m2o);

	expect(allowed?.item).toHaveProperty('field_a', 'Allowed A');
	expect(allowed?.item).not.toHaveProperty('field_b');
	expect(hidden?.item).toBeUndefined();
});
