import { assertType, describe, expectTypeOf, test } from 'vitest';
import type {
	CollectionName,
	DirectusAccess,
	DirectusComment,
	DirectusFlow,
	DirectusPreset,
	DirectusRole,
	DirectusUser,
	DirectusVersion,
	NestedPartial,
	ReadFlowOutput,
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

describe('NestedPartial on synthetic types', () => {
	test('mixed union: object member keeps its own NestedPartial, non-object members pass through', () => {
		type Case = NestedPartial<{ rel: { id: string; name: string } | string | null }>;

		assertType<Case>({ rel: { id: '1' } });
		assertType<Case>({ rel: 'id-string' });
		assertType<Case>({ rel: null });

		expectTypeOf<Extract<NonNullable<Case['rel']>, object>>().toEqualTypeOf<Partial<{ id: string; name: string }>>();
	});

	test('StringLiteralUnion member is not widened to plain string', () => {
		type Case = NestedPartial<{ status: StringLiteralUnion<'draft' | 'published'> }>;

		expectTypeOf<Case['status']>().toEqualTypeOf<StringLiteralUnion<'draft' | 'published'> | undefined>();

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
		const collection: string = 'collection_c';
		const payload = { collection, item: '1', comment: 'hi' };

		assertType<NestedPartial<DirectusComment<TestSchema>>>(payload);
		createComment(payload);
	});

	test('collection-name fields still accept an arbitrary string (preset, nullable)', () => {
		const collection: string = 'collection_c';
		const payload = { collection };

		assertType<NestedPartial<DirectusPreset<TestSchema>>>(payload);
		createPreset(payload);
	});

	test('collection-name fields still accept an arbitrary string (version)', () => {
		const collection: string = 'collection_c';
		const payload = { collection, key: 'draft' };

		assertType<NestedPartial<DirectusVersion<TestSchema>>>(payload);
		createContentVersion(payload);
	});

	test('StringLiteralUnion fields keep their literal members (status)', () => {
		type FlowParam = NestedPartial<DirectusFlow<TestSchema>>;

		expectTypeOf<FlowParam['status']>().toEqualTypeOf<StringLiteralUnion<'active' | 'inactive'> | undefined>();

		assertType<FlowParam>({ status: 'active' });
		assertType<FlowParam>({ status: 'some-custom-status' });
	});

	test('StringLiteralUnion fields keep their literal members when nullable (trigger, accountability)', () => {
		type FlowParam = NestedPartial<DirectusFlow<TestSchema>>;

		expectTypeOf<FlowParam['trigger']>().toEqualTypeOf<
			StringLiteralUnion<'event' | 'schedule' | 'operation' | 'webhook' | 'manual'> | null | undefined
		>();

		expectTypeOf<FlowParam['accountability']>().toEqualTypeOf<
			StringLiteralUnion<'all' | 'activity'> | null | undefined
		>();

		assertType<FlowParam>({ trigger: 'schedule', accountability: 'all' });
		assertType<FlowParam>({ trigger: null, accountability: null });
	});

	test('StringLiteralUnion fields keep their literal members when nullable (preset collection)', () => {
		type PresetParam = NestedPartial<DirectusPreset<TestSchema>>;

		expectTypeOf<PresetParam['collection']>().toEqualTypeOf<CollectionName<TestSchema> | null | undefined>();

		assertType<PresetParam>({ collection: 'collection_c' });
		assertType<PresetParam>({ collection: null });
	});

	test('StringLiteralUnion fields keep their literal members (version collection)', () => {
		type VersionParam = NestedPartial<DirectusVersion<TestSchema>>;

		expectTypeOf<VersionParam['collection']>().toEqualTypeOf<CollectionName<TestSchema> | undefined>();

		assertType<VersionParam>({ collection: 'collection_c' });
	});
});

describe('NestedPartial on mixed array unions (id string | relation object)', () => {
	test('partial object element is accepted (role.policies: string[] | DirectusAccess[])', () => {
		const payload = { policies: [{ policy: 'policy-id' }] };

		assertType<NestedPartial<DirectusRole<TestSchema>>>(payload);
		updateRole('role-id', payload);
	});

	test('still accepted through a schema that customizes a core collection', () => {
		const payload = { policies: [{ policy: 'policy-id' }], custom_field: true };

		assertType<NestedPartial<DirectusUser<TestSchema>>>(payload);
		updateUser('user-id', payload);
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
	test('comment.user_created / user_updated', () => {
		const payload = {
			collection: 'collection_a',
			item: '1',
			comment: 'hi',
			user_created: { email: 'a@b.com' },
			user_updated: { email: 'a@b.com' },
		};

		assertType<NestedPartial<DirectusComment<TestSchema>>>(payload);
		createComment(payload);
	});

	test('version.user_created / user_updated', () => {
		const payload = {
			user_created: { email: 'a@b.com' },
			user_updated: { email: 'a@b.com' },
		};

		assertType<NestedPartial<DirectusVersion<TestSchema>>>(payload);
		updateContentVersion('version-id', payload);
	});

	test('flow.operation', () => {
		const payload = { operation: { name: 'op-name' } };

		assertType<NestedPartial<DirectusFlow<TestSchema>>>(payload);
		updateFlow('flow-id', payload);
	});

	test('preset.user / preset.role', () => {
		const payload = {
			user: { email: 'a@b.com' },
			role: { name: 'role-name' },
		};

		assertType<NestedPartial<DirectusPreset<TestSchema>>>(payload);
		updatePreset(1, payload);
	});

	test('role.parent / children / policies / users', () => {
		const payload = {
			parent: { name: 'parent-role' },
			children: [{ name: 'child-role' }],
			policies: [{ policy: 'policy-id' }],
			users: [{ email: 'a@b.com' }],
		};

		assertType<NestedPartial<DirectusRole<TestSchema>>>(payload);
		updateRole('role-id', payload);
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

describe('StringLiteralUnion fields on the read/output path (ApplyQueryFields, not NestedPartial)', () => {
	test('ReadFlowOutput keeps the literal union, not widened to plain string', () => {
		type Output = ReadFlowOutput<TestSchema, { fields: ['*'] }>;

		expectTypeOf<Output['status']>().toEqualTypeOf<StringLiteralUnion<'active' | 'inactive'>>();

		expectTypeOf<Output['trigger']>().toEqualTypeOf<StringLiteralUnion<
			'event' | 'schedule' | 'operation' | 'webhook' | 'manual'
		> | null>();

		expectTypeOf<Output['accountability']>().toEqualTypeOf<StringLiteralUnion<'all' | 'activity'> | null>();
	});
});
