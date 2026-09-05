import { assertType, describe, expectTypeOf, test } from 'vitest';
import type {
	CollectionName,
	DirectusComment,
	DirectusFlow,
	DirectusPreset,
	DirectusRole,
	DirectusUser,
	DirectusVersion,
	NestedPartial,
	QueryFields,
	ReadFlowOutput,
	StringLiteralUnion,
} from '../src/index.js';
import { createComment, updateContentVersion, updateFlow, updatePreset, updateRole, updateUser } from '../src/index.js';
import type { TestSchema } from './schema.js';

describe('NestedPartial (type utility)', () => {
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

	test('a widened (non-literal) string is still assignable to a StringLiteralUnion member', () => {
		type Case = NestedPartial<{
			collection: StringLiteralUnion<'known_a' | 'known_b'>;
			nullable_collection: StringLiteralUnion<'known_a' | 'known_b'> | null;
		}>;

		const dynamic: string = 'anything';

		assertType<Case>({ collection: dynamic });
		assertType<Case>({ nullable_collection: dynamic });
		assertType<Case>({ nullable_collection: null });
	});

	test('plain nullable union is untouched', () => {
		type Case = NestedPartial<{ count: number | null }>;

		expectTypeOf<Case['count']>().toEqualTypeOf<number | null | undefined>();
	});

	test('Record<string, any> value passes through untouched (not mapped over its keys)', () => {
		type Case = NestedPartial<{ opts: Record<string, any> | null }>;

		expectTypeOf<Case['opts']>().toEqualTypeOf<Record<string, any> | null | undefined>();

		assertType<Case>({ opts: { a: 1, nested: { deep: true } } });
		assertType<Case>({ opts: null });
	});

	test('mixed id[] | object[] array union: a partial object element is accepted', () => {
		type Case = NestedPartial<{ policies: string[] | { id: string; policy: string }[] | null }>;

		assertType<Case>({ policies: [{ policy: 'p1' }] });
		assertType<Case>({ policies: ['p1'] });
		assertType<Case>({ policies: null });
	});

	test('object-union member becomes a nested object; StringLiteralUnion member stays string-like', () => {
		type Case = NestedPartial<{
			rel: { id: string; icon: string } | string | null;
			status: StringLiteralUnion<'active' | 'inactive'>;
		}>;

		expectTypeOf<Extract<NonNullable<Case['rel']>, object>>().toHaveProperty('icon');

		assertType<Case['status']>('active');
		assertType<Case['status']>('custom-status');
		// @ts-expect-error status is string-like, not relational — object payloads are rejected
		assertType<Case['status']>({ id: 'x' });
	});

	test('self-referential type: deep partials accepted, scalar members not widened', () => {
		type SelfRef = { id: string; label: string | null; child: SelfRef | string | null };

		assertType<NestedPartial<SelfRef>>({ label: 'foo', child: { child: { label: 'bar' } } });
		assertType<NestedPartial<SelfRef>>({ child: 'id-string' });
		assertType<NestedPartial<SelfRef>>({ child: null });

		// @ts-expect-error label is string | null — recursion must not widen scalar members
		assertType<NestedPartial<SelfRef>>({ label: 123 });
	});

	test('mutually-recursive types: partials accepted in both directions', () => {
		type Activity = { id: number; revisions: Revision[] | number[] | null };
		type Revision = { id: number; data: Record<string, any> | null; activity: Activity | number };

		assertType<NestedPartial<Activity>>({ revisions: [{ data: { a: 1 } }] });
		assertType<NestedPartial<Revision>>({ data: { a: 1 }, activity: { revisions: [{ id: 1 }] } });
	});
});

describe('NestedPartial on the Directus* schema types', () => {
	test('collection fields accept an arbitrary (non-literal) string', () => {
		const collection: string = 'some_collection';

		assertType<NestedPartial<DirectusComment<TestSchema>>>({ collection, item: '1', comment: 'hi' });
		assertType<NestedPartial<DirectusPreset<TestSchema>>>({ collection });
		assertType<NestedPartial<DirectusVersion<TestSchema>>>({ collection, key: 'draft' });
	});

	test('flow.status keeps its literal member set', () => {
		type FlowParam = NestedPartial<DirectusFlow<TestSchema>>;

		expectTypeOf<FlowParam['status']>().toEqualTypeOf<StringLiteralUnion<'active' | 'inactive'> | undefined>();

		assertType<FlowParam>({ status: 'active' });
		assertType<FlowParam>({ status: 'some-custom-status' });
	});

	test('flow.trigger / flow.accountability keep their literal member sets when nullable', () => {
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

	test('preset.collection resolves to CollectionName and is nullable', () => {
		type PresetParam = NestedPartial<DirectusPreset<TestSchema>>;

		expectTypeOf<PresetParam['collection']>().toEqualTypeOf<CollectionName<TestSchema> | null | undefined>();

		assertType<PresetParam>({ collection: 'collection_c' });
		assertType<PresetParam>({ collection: null });
	});

	test('version.collection resolves to CollectionName', () => {
		type VersionParam = NestedPartial<DirectusVersion<TestSchema>>;

		expectTypeOf<VersionParam['collection']>().toEqualTypeOf<CollectionName<TestSchema> | undefined>();

		assertType<VersionParam>({ collection: 'collection_c' });
	});

	test('a partial object element is accepted through a schema that customizes a core collection', () => {
		const payload = { policies: [{ policy: 'policy-id' }], custom_field: true };

		assertType<NestedPartial<DirectusUser<TestSchema>>>(payload);
		updateUser('user-id', payload);
	});

	test('relational fields stay nested-partial objects (comment.user_created / user_updated)', () => {
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

	test('relational fields stay nested-partial objects (version.user_created / user_updated)', () => {
		const payload = {
			user_created: { email: 'a@b.com' },
			user_updated: { email: 'a@b.com' },
		};

		assertType<NestedPartial<DirectusVersion<TestSchema>>>(payload);
		updateContentVersion('version-id', payload);
	});

	test('relational fields stay nested-partial objects (flow.operation)', () => {
		const payload = { operation: { name: 'op-name' } };

		assertType<NestedPartial<DirectusFlow<TestSchema>>>(payload);
		updateFlow('flow-id', payload);
	});

	test('relational fields stay nested-partial objects (preset.user / preset.role)', () => {
		const payload = {
			user: { email: 'a@b.com' },
			role: { name: 'role-name' },
		};

		assertType<NestedPartial<DirectusPreset<TestSchema>>>(payload);
		updatePreset(1, payload);
	});

	test('relational fields stay nested-partial objects (role.parent / children / policies / users)', () => {
		const payload = {
			parent: { name: 'parent-role' },
			children: [{ name: 'child-role' }],
			policies: [{ policy: 'policy-id' }],
			users: [{ email: 'a@b.com' }],
		};

		assertType<NestedPartial<DirectusRole<TestSchema>>>(payload);
		updateRole('role-id', payload);
	});

	test('flow.operation resolves to a real object while flow.status stays a StringLiteralUnion', () => {
		type FlowParam = NestedPartial<DirectusFlow<TestSchema>>;

		expectTypeOf<Extract<NonNullable<FlowParam['operation']>, object>>().toHaveProperty('name');

		assertType<FlowParam['status']>('active');
		// @ts-expect-error status is a StringLiteralUnion, not relational — object payloads are rejected
		assertType<FlowParam['status']>({ name: 'active' });
	});
});

describe('StringLiteralUnion fields on the read/output path (not NestedPartial)', () => {
	test('ReadFlowOutput keeps the literal union, not widened to plain string', () => {
		type Output = ReadFlowOutput<TestSchema, { fields: ['*'] }>;

		expectTypeOf<Output['status']>().toEqualTypeOf<StringLiteralUnion<'active' | 'inactive'>>();

		expectTypeOf<Output['trigger']>().toEqualTypeOf<StringLiteralUnion<
			'event' | 'schedule' | 'operation' | 'webhook' | 'manual'
		> | null>();

		expectTypeOf<Output['accountability']>().toEqualTypeOf<StringLiteralUnion<'all' | 'activity'> | null>();
	});

	test('a StringLiteralUnion field is classified as flat, not relational', () => {
		interface Schema {
			items: { id: string; status: StringLiteralUnion<'a' | 'b'> }[];
		}

		type ItemFields = QueryFields<Schema, Schema['items'][number]>;

		assertType<ItemFields>(['status']);
		assertType<ItemFields>(['*']);

		// @ts-expect-error status is not relational — an object field-spec must be rejected
		assertType<ItemFields>([{ status: ['*'] }]);
	});
});
