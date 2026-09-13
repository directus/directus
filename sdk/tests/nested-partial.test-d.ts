import { assertType, describe, expectTypeOf, test } from 'vitest';
import type {
	CollectionName,
	DirectusComment,
	DirectusFlow,
	DirectusPreset,
	DirectusRole,
	DirectusUser,
	DirectusVersion,
	NestedItemsInput,
	NestedPartial,
	QueryFields,
	ReadFlowOutput,
	StringLiteralUnion,
} from '../src/index.js';
import { createItem, createItems, updateItem, updateItems, updateItemsBatch } from '../src/index.js';
import type { CollectionA, CollectionC, TestSchema } from './schema.js';

describe('NestedPartial', () => {
	test('only the object member of a union becomes partial', () => {
		type Case = NestedPartial<{ rel: { id: string; name: string } | string | null }>;

		expectTypeOf<Case['rel']>().toEqualTypeOf<{ id?: string; name?: string } | string | null | undefined>();
	});

	test('StringLiteralUnion keeps its literals and accepts any string', () => {
		type Case = NestedPartial<{ status: StringLiteralUnion<'draft' | 'published'> | null }>;

		expectTypeOf<Case['status']>().toEqualTypeOf<StringLiteralUnion<'draft' | 'published'> | null | undefined>();

		// identity alone wouldn't prove a widened (non-literal) string is still accepted
		const dynamic: string = 'anything';
		assertType<Case>({ status: dynamic });
	});

	test('a nullable scalar keeps its null member', () => {
		type Case = NestedPartial<{ count: number | null }>;

		expectTypeOf<Case['count']>().toEqualTypeOf<number | null | undefined>();
	});

	test('Record<string, any> passes through untouched', () => {
		type Case = NestedPartial<{ opts: Record<string, any> | null }>;

		expectTypeOf<Case['opts']>().toEqualTypeOf<Record<string, any> | null | undefined>();
	});

	test('built-in object types pass through untouched', () => {
		type Case = NestedPartial<{ when: Date; when_nullable: Date | null; pattern: RegExp }>;

		expectTypeOf<Case['when']>().toEqualTypeOf<Date | undefined>();
		expectTypeOf<Case['when_nullable']>().toEqualTypeOf<Date | null | undefined>();
		expectTypeOf<Case['pattern']>().toEqualTypeOf<RegExp | undefined>();
	});

	test('an `any` field passes through untouched', () => {
		type Case = NestedPartial<{ meta: any }>;

		expectTypeOf<Case['meta']>().toEqualTypeOf<any>();
	});

	test('an already-optional field stays optional', () => {
		type Case = NestedPartial<{ logs?: { message: string }[] }>;

		// .branded is needed here because NestedItemsInput's `update` entries are an
		// intersection type (NestedPartial<RawItem> & { id: ... }), which plain toEqualTypeOf
		// treats as distinct from its flattened equivalent even though they accept identical
		// values: https://vitest.dev/api/expect-typeof.html#branded
		expectTypeOf<Case['logs']>().branded.toEqualTypeOf<
			| { message?: string }[]
			| {
					create?: { message?: string }[];
					update?: { message?: string; id: string | number }[];
					delete?: (string | number)[];
			  }
			| undefined
		>();
	});

	test('array elements become nested partials', () => {
		type Case = NestedPartial<{ tags: { id: string; name: string }[] }>;

		expectTypeOf<Case['tags']>().branded.toEqualTypeOf<
			| { id?: string; name?: string }[]
			| {
					create?: { id?: string; name?: string }[];
					update?: { id: string; name?: string }[];
					delete?: string[];
			  }
			| undefined
		>();
	});

	test('only object elements of an id[] | object[] union become partial', () => {
		type Case = NestedPartial<{ policies: string[] | { id: string; policy: string }[] | null }>;

		expectTypeOf<Case['policies']>().branded.toEqualTypeOf<
			| string[]
			| { id?: string; policy?: string }[]
			| {
					create?: { id?: string; policy?: string }[];
					update?: { id: string; policy?: string }[];
					delete?: string[];
			  }
			| null
			| undefined
		>();
	});

	test('self-referential type recurses without widening scalars', () => {
		type SelfRef = { id: string; label: string | null; child: SelfRef | string | null };

		assertType<NestedPartial<SelfRef>>({ label: 'foo', child: { child: { label: 'bar' } } });
		assertType<NestedPartial<SelfRef>>({ child: 'id-string' });
		assertType<NestedPartial<SelfRef>>({ child: null });

		// @ts-expect-error label is string | null — recursion must not widen scalar members
		assertType<NestedPartial<SelfRef>>({ label: 123 });
	});

	test('mutually-recursive types recurse in both directions', () => {
		type Activity = { id: number; revisions: Revision[] | number[] | null };
		type Revision = { id: number; data: Record<string, any> | null; activity: Activity | number };

		assertType<NestedPartial<Activity>>({ revisions: [{ data: { a: 1 } }] });
		assertType<NestedPartial<Revision>>({ data: { a: 1 }, activity: { revisions: [{ id: 1 }] } });
	});
});

describe('NestedPartial on core collection types', () => {
	test('collection fields accept an arbitrary (non-literal) string', () => {
		const collection: string = 'some_collection';

		assertType<NestedPartial<DirectusComment<TestSchema>>>({ collection, item: '1', comment: 'hi' });
		assertType<NestedPartial<DirectusPreset<TestSchema>>>({ collection });
		assertType<NestedPartial<DirectusVersion<TestSchema>>>({ collection, key: 'draft' });
	});

	test('collection fields with string literal union keep their literal member sets', () => {
		type FlowParam = NestedPartial<DirectusFlow<TestSchema>>;

		expectTypeOf<FlowParam['status']>().toEqualTypeOf<StringLiteralUnion<'active' | 'inactive'> | undefined>();

		assertType<FlowParam>({ status: 'active', trigger: 'schedule', accountability: 'all' });
		assertType<FlowParam>({ status: 'some-custom-status', trigger: null, accountability: null });
	});

	test('preset.collection resolves to CollectionName and is nullable', () => {
		type PresetParam = NestedPartial<DirectusPreset<TestSchema>>;

		expectTypeOf<PresetParam['collection']>().toEqualTypeOf<CollectionName<TestSchema> | null | undefined>();

		assertType<PresetParam>({ collection: 'collection_c' });
		assertType<PresetParam>({ collection: null });
	});

	test('custom fields on a core collection stay partial', () => {
		assertType<NestedPartial<DirectusUser<TestSchema>>>({
			policies: [{ policy: 'policy-id' }],
			custom_field: true,
		});
	});

	test('relational fields stay nested-partial objects', () => {
		assertType<NestedPartial<DirectusComment<TestSchema>>>({
			collection: 'collection_a',
			item: '1',
			comment: 'hi',
			user_created: { email: 'a@b.com' },
			user_updated: { email: 'a@b.com' },
		});

		assertType<NestedPartial<DirectusVersion<TestSchema>>>({
			user_created: { email: 'a@b.com' },
			user_updated: { email: 'a@b.com' },
		});

		assertType<NestedPartial<DirectusFlow<TestSchema>>>({ operation: { name: 'op-name' } });

		assertType<NestedPartial<DirectusPreset<TestSchema>>>({
			user: { email: 'a@b.com' },
			role: { name: 'role-name' },
		});

		assertType<NestedPartial<DirectusRole<TestSchema>>>({
			parent: { name: 'parent-role' },
			children: [{ name: 'child-role' }],
			policies: [{ policy: 'policy-id' }],
			users: [{ email: 'a@b.com' }],
		});
	});
});

describe('NestedPartial accepts the detailed create/update/delete object for relation arrays (#25955)', () => {
	test('a scalar array field does not gain the detailed object', () => {
		type Case = NestedItemsInput<string>;

		expectTypeOf<Case>().toEqualTypeOf<never>();
	});

	test('an o2m field accepts the plain array shorthand and the detailed object', () => {
		type Case = NestedPartial<CollectionA>;

		assertType<Case>({ o2m: [{ id: 1, parent_id: 1 }] });

		assertType<Case>({
			o2m: {
				create: [{ parent_id: 1 }],
				update: [{ id: 1, non_nullable: 'changed' }],
				delete: [2, 3],
			},
		});
	});

	test('an m2m field accepts the plain array shorthand and the detailed object', () => {
		type Case = NestedPartial<CollectionA>;

		assertType<Case>({ m2m: [{ collection_a_id: 1, collection_b_id: 1 }] });

		assertType<Case>({
			m2m: {
				create: [{ collection_b_id: 1 }],
				update: [{ id: 1, collection_b_id: 2 }],
				delete: [4],
			},
		});
	});

	test('an m2a field accepts the plain array shorthand and the detailed object', () => {
		type Case = NestedPartial<CollectionA>;

		assertType<Case>({ m2a: [{ collection_a_id: 1, collection: 'collection_b', item: '1' }] });

		assertType<Case>({
			m2a: {
				create: [{ collection: 'collection_b', item: '1' }],
				update: [{ id: 1, collection: 'collection_c' }],
				delete: [6],
			},
		});
	});

	test('a scalar (m2o) relation field does not gain the detailed object', () => {
		assertType<NestedPartial<CollectionA>>({
			// @ts-expect-error m2o is a scalar relation (RelatedItem | PK), not an array — no Detailed object
			m2o: { create: [{ string_field: 'a' }] },
		});
	});

	test('createItems, updateItems, and updateItemsBatch accept the detailed object too', () => {
		createItems<TestSchema, 'collection_a', any>('collection_a', [{ o2m: { create: [{ non_nullable: 'a' }] } }]);

		updateItems<TestSchema, 'collection_a', any>('collection_a', [1], {
			m2m: { delete: [4] },
		});

		updateItemsBatch<TestSchema, 'collection_a', any>('collection_a', [{ id: 1, o2m: { delete: [2] } }]);
	});

	test('an update entry requires the related item id', () => {
		assertType<NestedItemsInput<CollectionC>>({
			// @ts-expect-error update entries must carry the related item's id
			update: [{ non_nullable: 'changed' }],
		});
	});

	test('delete only accepts primary key values, not full objects', () => {
		assertType<NestedItemsInput<CollectionC>>({
			// @ts-expect-error delete only takes primary keys
			delete: [{ id: 2 }],
		});
	});

	test('createItem and updateItem accept the detailed object for relation arrays', () => {
		createItem<TestSchema, 'collection_a', any>('collection_a', {
			o2m: { create: [{ non_nullable: 'a' }], delete: [1] },
		});

		updateItem<TestSchema, 'collection_a', any>('collection_a', 1, {
			m2m: { update: [{ id: 5, collection_b_id: 2 }] },
		});
	});
});

describe('StringLiteralUnion on the read path', () => {
	test('ReadFlowOutput keeps the literal union', () => {
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
