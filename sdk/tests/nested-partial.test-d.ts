import { assertType, describe, expectTypeOf, test } from 'vitest';
import type {
	CollectionName,
	DirectusComment,
	DirectusField,
	DirectusFlow,
	DirectusPreset,
	DirectusRole,
	DirectusSettings,
	DirectusUser,
	DirectusVersion,
	NestedItemsInput,
	NestedPartial,
	QueryFields,
	ReadFlowOutput,
	StringLiteralUnion,
} from '../src/index.js';
import {
	createDirectus,
	createItem,
	createItems,
	rest,
	updateItem,
	updateItems,
	updateItemsBatch,
	updatePolicy,
	updateRole,
	updateSingleton,
} from '../src/index.js';
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
		type Case = NestedPartial<{ logs?: { message: string }[] }, any>;

		// .branded is needed here because NestedItemsInput's `update` entries are an
		// intersection type (NestedPartial<RawItem> & { id: ... }), which plain toEqualTypeOf
		// treats as distinct from its flattened equivalent even though they accept identical
		// values: https://vitest.dev/api/expect-typeof.html#branded
		expectTypeOf<Case['logs']>().branded.toEqualTypeOf<
			| { message?: string }[]
			| {
					create?: { message?: string }[];
					// no `id` field on the item, so update entries aren't forced to carry one either
					update?: { message?: string }[];
					delete?: (string | number)[];
			  }
			| undefined
		>();
	});

	test('array elements become nested partials', () => {
		type Case = NestedPartial<{ tags: { id: string; name: string }[] }, any>;

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
		type Case = NestedPartial<{ policies: string[] | { id: string; policy: string }[] | null }, any>;

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
		type Case = NestedPartial<CollectionA, TestSchema>;

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
		type Case = NestedPartial<CollectionA, TestSchema>;

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
		type Case = NestedPartial<CollectionA, TestSchema>;

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
		assertType<NestedPartial<CollectionA, TestSchema>>({
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
		assertType<NestedItemsInput<CollectionC, TestSchema>>({
			// @ts-expect-error update entries must carry the related item's id
			update: [{ non_nullable: 'changed' }],
		});
	});

	test('delete only accepts primary key values, not full objects', () => {
		assertType<NestedItemsInput<CollectionC, TestSchema>>({
			// @ts-expect-error delete only takes primary keys
			delete: [{ id: 2 }],
		});
	});

	test('an item with no `id` field is not forced to carry one on update', () => {
		type CustomPkItem = { slug: string; title: string };

		assertType<NestedItemsInput<CustomPkItem, any>>({
			update: [{ slug: 'a', title: 'b' }],
		});
	});

	test('a union of item types accepts a mix of its members in the same create', () => {
		type Related = { id: number; a: string } | { id: number; b: string };

		assertType<NestedPartial<{ rel: Related[] }, any>>({ rel: [{ a: 'x' }, { b: 'y' }] });

		assertType<NestedPartial<{ rel: Related[] }, any>>({
			rel: { create: [{ a: 'x' }, { b: 'y' }], delete: [1] },
		});
	});

	test('an id[] | object[] union accepts the detailed object', () => {
		assertType<NestedPartial<{ rel: (number | { id: number; a: string })[] }, any>>({
			rel: { create: [{ a: 'x' }], delete: [1] },
		});
	});

	test('a built-in object array does not gain the detailed object', () => {
		assertType<NestedPartial<{ dates: Date[] }>>({
			// @ts-expect-error Date[] is a scalar array, not a relation
			dates: { create: [new Date()] },
		});
	});

	test('a nullable relation array accepts the detailed object', () => {
		assertType<NestedPartial<{ rel: { id: number }[] | null }, any>>({ rel: { delete: [1] } });
		assertType<NestedPartial<{ rel: { id: number }[] | null }, any>>({ rel: null });
	});

	test('a related item with fields named create, update, and delete is not read as the detailed object', () => {
		type Related = { id: number; create: string; update: number; delete: boolean };
		type JsonRelated = { id: number; create: { halo: string } };

		assertType<NestedPartial<{ rel: Related[] }, any>>({ rel: [{ create: 'x', update: 1, delete: true }] });
		assertType<NestedPartial<{ rel: JsonRelated[] }, any>>({ rel: [{ create: { halo: '' } }] });

		assertType<NestedPartial<{ rel: Related[] }, any>>({
			rel: { create: [{ create: 'x' }], update: [{ id: 1, delete: true }], delete: [1] },
		});

		assertType<NestedPartial<{ rel: Related[] }, any>>({
			// @ts-expect-error the detailed `create` must be an array, not the item's own scalar field
			rel: { create: 'x' },
		});

		assertType<NestedPartial<{ rel: JsonRelated[] }, any>>({
			// @ts-expect-error the detailed `create` must be an array, not the item's own object field
			rel: { create: { halo: '' } },
		});
	});

	test('a relation item field named create can hold its own nested detailed object', () => {
		type Other = { id: number; label: string };
		type Related = { id: number; create: Other[] };

		assertType<NestedPartial<{ rel: Related[] }, any>>({
			rel: { create: [{ create: { create: [{ label: 'x' }] } }] },
		});
	});

	test('a one-to-one or m2o item with a `create` field is plain data', () => {
		type Related = { id: number; create: string };

		assertType<NestedPartial<{ rel: Related }>>({ rel: { create: 'x' } });

		assertType<NestedPartial<{ rel: Related }>>({
			// @ts-expect-error an m2o does not accept the detailed object
			rel: { create: [{ id: 1 }] },
		});
	});

	test('unknown keys in the detailed object are rejected', () => {
		assertType<NestedItemsInput<CollectionC, TestSchema>>({
			// @ts-expect-error `creat` is a deliberate misspelling; only create, update, and delete are valid
			creat: [],
		});
	});

	test('a string primary key rejects numeric delete values', () => {
		type Related = { id: string; a: string };

		assertType<NestedItemsInput<Related, any>>({ delete: ['abc'], update: [{ id: 'abc' }] });

		assertType<NestedItemsInput<Related, any>>({
			// @ts-expect-error uuid primary keys are strings
			delete: [1],
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

describe('NestedPartial only offers the detailed object when the Schema shows a relation (review on #28232)', () => {
	type WithJson = {
		id: number;
		links: { url: string }[];
		tags: number[] | CollectionC[];
	};

	type JsonSchema = { with_json: WithJson[]; collection_c: CollectionC[] };

	test('a JSON object array does not accept the detailed object', () => {
		assertType<NestedPartial<WithJson, JsonSchema>>({ links: [{ url: 'a' }] });

		assertType<NestedPartial<WithJson, JsonSchema>>({ tags: { create: [{ id: 1 }], delete: [2] } });

		assertType<NestedPartial<WithJson, JsonSchema>>({
			// @ts-expect-error links is JSON
			links: { delete: [1] },
		});
	});

	test('without a Schema only the array shorthand applies, as before the detailed object existed', () => {
		assertType<NestedPartial<CollectionA>>({ o2m: [{ id: 1, parent_id: 1 }] });

		assertType<NestedPartial<CollectionA>>({
			// @ts-expect-error no Schema to show o2m is a relation
			o2m: { delete: [1] },
		});
	});

	test('an `any` Schema (an untyped client) accepts the detailed object like every other input', () => {
		assertType<NestedPartial<WithJson, any>>({ tags: { delete: [1] } });
	});

	test('a relation typed as a partial of its collection loses the detailed object', () => {
		type Schema = { holder: { id: number; slim: Pick<CollectionC, 'id'>[] }[]; collection_c: CollectionC[] };

		assertType<NestedPartial<Schema['holder'][number], Schema>>({
			// @ts-expect-error Pick<> is not a collection item
			slim: { delete: [1] },
		});
	});

	test('known gap: a JSON field typed as an array of a collection item is indistinguishable from a relation', () => {
		type Schema = { json_holder: { id: number; payload: CollectionC[] }[]; collection_c: CollectionC[] };

		assertType<NestedPartial<Schema['json_holder'][number], Schema>>({ payload: { delete: [1] } });
	});
});

describe('the Schema given to createDirectus decides where the detailed object is offered', () => {
	type Tag = { id: number; label: string };
	type Doc = { id: number; title: string; tags: number[] | Tag[]; links: { url: string }[] };
	type JsonSchema = { docs: Doc[]; tags: Tag[] };

	test('relation arrays accept it through every items command', () => {
		const client = createDirectus<JsonSchema>('https://directus.example.com').with(rest());

		client.request(createItem('docs', { tags: { create: [{ label: 'a' }], delete: [1] } }));
		client.request(createItems('docs', [{ tags: { create: [{ label: 'a' }] } }]));
		client.request(updateItems('docs', [1], { tags: { update: [{ id: 1, label: 'b' }] } }));
		client.request(updateItemsBatch('docs', [{ id: 1, tags: { delete: [2] } }]));
		client.request(updateItem('docs', 1, { tags: { create: [{ label: 'a' }] } }));
	});

	test('JSON arrays reject it through the items commands that constrain their input', () => {
		const client = createDirectus<JsonSchema>('https://directus.example.com').with(rest());

		// @ts-expect-error links is JSON
		client.request(createItem('docs', { links: { delete: [1] } }));
		// @ts-expect-error links is JSON
		client.request(createItems('docs', [{ links: { delete: [1] } }]));
		// @ts-expect-error links is JSON
		client.request(updateItems('docs', [1], { links: { delete: [1] } }));
		// @ts-expect-error links is JSON
		client.request(updateItemsBatch('docs', [{ id: 1, links: { delete: [1] } }]));
	});

	test('an untyped client accepts it', () => {
		const client = createDirectus('https://directus.example.com').with(rest());

		client.request(updateItems('docs', [1], { links: { delete: [1] } }));
	});
});

describe('NestedPartial offers the detailed object on core relation arrays', () => {
	test('roles accept it for children and users', () => {
		const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

		client.request(
			updateRole('role-id', {
				children: { create: [{ name: 'child' }], delete: ['a'] },
				users: { create: [{ email: 'a@b.com' }], delete: ['user-id'] },
			}),
		);
	});

	test('policies accept it for permissions', () => {
		const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

		client.request(
			updatePolicy('policy-id', {
				permissions: { create: [{ collection: 'collection_a', action: 'read' }], delete: [1] },
			}),
		);
	});

	test('a custom field type on directus_users does not stop roles.users from accepting it', () => {
		assertType<NestedPartial<DirectusRole<TestSchema>, TestSchema>>({ users: { delete: ['user-id'] } });
	});
});

describe('NestedPartial rejects the detailed object on core JSON arrays', () => {
	test('settings JSON arrays', () => {
		type Case = NestedPartial<DirectusSettings<TestSchema>, TestSchema>;

		assertType<Case>({ custom_aspect_ratios: [{ text: 'a', value: 1 }] });

		assertType<Case>({
			// @ts-expect-error custom_aspect_ratios is JSON
			custom_aspect_ratios: { create: [{ text: 'a', value: 1 }] },
		});

		assertType<Case>({
			// @ts-expect-error visual_editor_urls is JSON
			visual_editor_urls: { delete: [1] },
		});

		assertType<Case>({
			// @ts-expect-error Record<string, any> is not a collection item
			ai_openai_compatible_models: { create: [{ id: 'a' }] },
		});
	});

	test('field meta JSON arrays', () => {
		assertType<NestedPartial<DirectusField<TestSchema>, TestSchema>>({
			meta: {
				// @ts-expect-error conditions is JSON
				conditions: { create: [] },
			},
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

describe('detailed object review gaps', () => {
	test('a relation typed with a custom core-collection type accepts the detailed object', () => {
		type MyUser = { custom_field: boolean };
		type Schema = { directus_users: MyUser[]; articles: { id: number; editors: MyUser[] }[] };

		assertType<NestedPartial<Schema['articles'][number], Schema>>({ editors: { delete: ['user-id'] } });
	});

	test('a JSON array whose element is a structural subtype of a collection item rejects the detailed object', () => {
		type Link = { id: number; url: string };
		type Schema = { links: Link[]; docs: { id: number; meta_links: { id: number; url: string; label: string }[] }[] };

		assertType<NestedPartial<Schema['docs'][number], Schema>>({
			// @ts-expect-error meta_links is JSON
			meta_links: { delete: [1] },
		});
	});

	test('a mixed JSON | relation union only offers the collection member in the detailed object', () => {
		type Schema = { holder: { id: number; rel: ({ url: string } | CollectionC)[] }[]; collection_c: CollectionC[] };
		type Case = NestedPartial<Schema['holder'][number], Schema>;

		assertType<Case>({ rel: { create: [{ non_nullable: 'a' }] } });

		assertType<Case>({
			// @ts-expect-error { url } is not a collection_c item
			rel: { create: [{ url: 'x' }] },
		});

		assertType<Case>({
			// @ts-expect-error collection_c has a numeric primary key
			rel: { delete: ['abc'] },
		});
	});

	test('an update entry requires a custom primary key', () => {
		type Page = { slug: string; title: string };
		type Schema = { pages: Page[]; holder: { id: number; pages: Page[] }[] };

		assertType<NestedPartial<Schema['holder'][number], Schema>>({
			// @ts-expect-error update entries must carry the slug primary key
			pages: { update: [{ title: 'x' }] },
		});
	});

	test('an optional `id` keeps its type on delete', () => {
		type Item = { id?: number; label: string };
		type Schema = { items: Item[]; holder: { id: number; items: Item[] }[] };

		assertType<NestedPartial<Schema['holder'][number], Schema>>({
			// @ts-expect-error the primary key is numeric
			items: { delete: ['abc'] },
		});
	});

	describe('single-item commands reject the detailed object on JSON arrays', () => {
		type Doc = { id: number; links: { url: string }[] };
		type Settings = { id: number; links: { url: string }[] };
		type JsonSchema = { docs: Doc[]; app_settings: Settings };

		const client = createDirectus<JsonSchema>('https://directus.example.com').with(rest());

		test('updateItem', () => {
			// @ts-expect-error links is JSON
			client.request(updateItem('docs', 1, { links: { delete: [1] } }));
		});

		test('updateSingleton', () => {
			// @ts-expect-error links is JSON
			client.request(updateSingleton('app_settings', { links: { delete: [1] } }));
		});
	});
});
