import { assertType, describe, expectTypeOf, test } from 'vitest';
import type {
	DirectusAccess,
	DirectusFlow,
	DirectusPreset,
	DirectusRole,
	DirectusVersion,
	NestedPartial,
	StringLiteralUnion,
} from '../src/index.js';
import {
	createComment,
	createContentVersion,
	createDirectus,
	createPreset,
	rest,
	updateContentVersion,
	updateFlow,
	updatePreset,
	updateRole,
	updateUser,
} from '../src/index.js';
import type { TestSchema } from './schema.js';

describe('NestedPartial / NestedUnion on synthetic types', () => {
	test('mixed union: object member keeps its own NestedPartial, non-object members pass through', () => {
		type Case = NestedPartial<{ rel: { id: string; name: string } | string | null }>;

		assertType<Case>({ rel: { id: '1' } });
		assertType<Case>({ rel: 'id-string' });
		assertType<Case>({ rel: null });

		expectTypeOf<Extract<NonNullable<Case['rel']>, object>>().toEqualTypeOf<Partial<{ id: string; name: string }>>();
	});

	test('StringLiteralUnion member is not widened to plain string', () => {
		type Case = NestedPartial<{ status: StringLiteralUnion<'draft' | 'published'> }>;

		expectTypeOf<Case['status']>().not.toEqualTypeOf<string | undefined>();

		assertType<Case>({ status: 'draft' });
		assertType<Case>({ status: 'some-custom-status' });
	});

	test('plain nullable union is untouched', () => {
		type Case = NestedPartial<{ count: number | null }>;

		expectTypeOf<Case['count']>().toEqualTypeOf<number | null | undefined>();
	});
});

describe('NestedPartial', () => {
	test('collection-name fields still accept an arbitrary string (comment)', () => {
		const client = createDirectus<TestSchema>('http://localhost:8055').with(rest());
		const collection: string = 'collection_c';

		client.request(createComment({ collection, item: '1', comment: 'hi' }));
	});

	test('collection-name fields still accept an arbitrary string (preset, nullable)', () => {
		const client = createDirectus<TestSchema>('http://localhost:8055').with(rest());
		const collection: string = 'collection_c';

		client.request(createPreset({ collection }));
	});

	test('collection-name fields still accept an arbitrary string (version)', () => {
		const client = createDirectus<TestSchema>('http://localhost:8055').with(rest());
		const collection: string = 'collection_c';

		client.request(createContentVersion({ collection, key: 'draft' }));
	});

	test('StringLiteralUnion fields keep their literal members (status)', () => {
		type FlowParam = NestedPartial<DirectusFlow<TestSchema>>;

		// If this were widened to plain `string`, it would equal `string | undefined`.
		expectTypeOf<FlowParam['status']>().not.toEqualTypeOf<string | undefined>();

		assertType<FlowParam>({ status: 'active' });
		assertType<FlowParam>({ status: 'some-custom-status' });
	});

	test('StringLiteralUnion fields keep their literal members when nullable (trigger, accountability)', () => {
		type FlowParam = NestedPartial<DirectusFlow<TestSchema>>;

		expectTypeOf<FlowParam['trigger']>().not.toEqualTypeOf<string | null | undefined>();
		expectTypeOf<FlowParam['accountability']>().not.toEqualTypeOf<string | null | undefined>();

		assertType<FlowParam>({ trigger: 'schedule', accountability: 'all' });
		assertType<FlowParam>({ trigger: null, accountability: null });
	});

	test('StringLiteralUnion fields keep their literal members when nullable (preset collection)', () => {
		type PresetParam = NestedPartial<DirectusPreset<TestSchema>>;

		expectTypeOf<PresetParam['collection']>().not.toEqualTypeOf<string | null | undefined>();

		assertType<PresetParam>({ collection: 'collection_c' });
		assertType<PresetParam>({ collection: null });
	});

	test('StringLiteralUnion fields keep their literal members (version collection)', () => {
		type VersionParam = NestedPartial<DirectusVersion<TestSchema>>;

		expectTypeOf<VersionParam['collection']>().not.toEqualTypeOf<string | undefined>();

		assertType<VersionParam>({ collection: 'collection_c' });
	});
});

describe('NestedPartial on mixed array unions (id string | relation object)', () => {
	test('partial object element is accepted (role.policies: string[] | DirectusAccess[])', () => {
		const client = createDirectus<TestSchema>('http://localhost:8055').with(rest());

		client.request(updateRole('role-id', { policies: [{ policy: 'policy-id' }] }));
	});

	test('still accepted through a schema that customizes a core collection', () => {
		const client = createDirectus<TestSchema>('http://localhost:8055').with(rest());

		client.request(updateUser('user-id', { policies: [{ policy: 'policy-id' }], custom_field: true }));
	});

	test('response type keeps both the string and object union members', async () => {
		interface Collections {
			a_collection: { id: string };
		}

		const client = createDirectus<Collections>('URL').with(rest());

		const result = await client.request(updateRole('role-id', { policies: [{ policy: 'policy-id' }] }));

		result.policies satisfies string[] | DirectusAccess<Collections>[];
	});
});

describe('NestedPartial keeps other relational fields as nested-partial objects', () => {
	const client = createDirectus<TestSchema>('http://localhost:8055').with(rest());

	test('comment.user_created / user_updated', () => {
		client.request(
			createComment({
				collection: 'collection_a',
				item: '1',
				comment: 'hi',
				user_created: { email: 'a@b.com' },
				user_updated: { email: 'a@b.com' },
			}),
		);
	});

	test('version.user_created / user_updated', () => {
		client.request(
			updateContentVersion('version-id', {
				user_created: { email: 'a@b.com' },
				user_updated: { email: 'a@b.com' },
			}),
		);
	});

	test('flow.operation', () => {
		client.request(
			updateFlow('flow-id', {
				operation: { name: 'op-name' },
			}),
		);
	});

	test('preset.user / preset.role', () => {
		client.request(
			updatePreset(1, {
				user: { email: 'a@b.com' },
				role: { name: 'role-name' },
			}),
		);
	});

	test('role.parent / children / policies / users', () => {
		client.request(
			updateRole('role-id', {
				parent: { name: 'parent-role' },
				children: [{ name: 'child-role' }],
				policies: [{ policy: 'policy-id' }],
				users: [{ email: 'a@b.com' }],
			}),
		);
	});

	test('relational fields resolve to a real object, not a StringLiteralUnion', () => {
		type FlowParam = NestedPartial<DirectusFlow<TestSchema>>;
		type RoleParam = NestedPartial<DirectusRole<TestSchema>>;
		type PresetParam = NestedPartial<DirectusPreset<TestSchema>>;

		expectTypeOf<Extract<NonNullable<FlowParam['operation']>, object>>().toHaveProperty('name');
		expectTypeOf<Extract<NonNullable<RoleParam['parent']>, object>>().toHaveProperty('icon');
		expectTypeOf<Extract<NonNullable<PresetParam['role']>, object>>().toHaveProperty('icon');

		assertType<FlowParam['status']>('active');
		// @ts-expect-error status is a StringLiteralUnion, not relational — object payloads are rejected
		assertType<FlowParam['status']>({ name: 'active' });
	});
});
