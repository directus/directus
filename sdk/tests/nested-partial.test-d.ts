import { assertType, describe, expectTypeOf, test } from 'vitest';
import type {
	CollectionName,
	DirectusComment,
	DirectusFile,
	DirectusFlow,
	DirectusPreset,
	DirectusRole,
	DirectusUser,
	DirectusVersion,
	JsonValue,
	NestedPartial,
	QueryFields,
	ReadFlowOutput,
	StringLiteralUnion,
} from '../src/index.js';
import { createItem, createItems, updateItem, updateItems } from '../src/index.js';
import type { CollectionB, CollectionC, TestSchema } from './schema.js';

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

		expectTypeOf<Case['logs']>().toEqualTypeOf<{ message?: string }[] | undefined>();
	});

	test('array elements become nested partials', () => {
		type Case = NestedPartial<{ tags: { id: string; name: string }[] }>;

		expectTypeOf<Case['tags']>().toEqualTypeOf<{ id?: string; name?: string }[] | undefined>();
	});

	test('only object elements of an id[] | object[] union become partial', () => {
		type Case = NestedPartial<{ policies: string[] | { id: string; policy: string }[] | null }>;

		expectTypeOf<Case['policies']>().toEqualTypeOf<string[] | { id?: string; policy?: string }[] | null | undefined>();
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

describe('NestedPartial maps literal field-type markers on the write path (#21599)', () => {
	test('a json field accepts any JsonValue, not the literal "json"', () => {
		type Case = NestedPartial<CollectionB>;

		expectTypeOf<Case['json_field']>().toEqualTypeOf<JsonValue | null | undefined>();

		assertType<Case>({ json_field: { test: 'object' } });
		assertType<Case>({ json_field: ['a', 'b'] });
		// the marker string itself is now just a plain string value, which is valid JSON
		assertType<Case>({ json_field: 'json' });
		assertType<Case>({ json_field: null });

		// @ts-expect-error a function is not a JsonValue
		assertType<Case>({ json_field: () => 'nope' });
	});

	test('a csv field accepts string[], not the literal "csv"', () => {
		type Case = NestedPartial<CollectionB>;

		expectTypeOf<Case['csv_field']>().toEqualTypeOf<string[] | null | undefined>();

		assertType<Case>({ csv_field: ['a', 'b'] });

		// @ts-expect-error a csv field is a string[] on input, not a single string
		assertType<Case>({ csv_field: 'a,b' });
	});

	test('datetime, date and time fields accept a string, not the literal marker', () => {
		type Case = NestedPartial<CollectionC>;

		expectTypeOf<Case['dt_field']>().toEqualTypeOf<string | null | undefined>();
		expectTypeOf<Case['date_field']>().toEqualTypeOf<string | null | undefined>();
		expectTypeOf<Case['time_field']>().toEqualTypeOf<string | null | undefined>();

		assertType<Case>({
			dt_field: '2024-02-27T11:27:25+00:00',
			date_field: '2024-02-27',
			time_field: '11:27:25',
		});

		// @ts-expect-error dt_field is a string on input, not a number
		assertType<Case>({ dt_field: 123 });
	});

	test('non-marker fields are left untouched', () => {
		type Case = NestedPartial<CollectionC>;

		// plain strings and relations keep their existing behavior
		expectTypeOf<Case['nullable']>().toEqualTypeOf<string | null | undefined>();
		expectTypeOf<Case['non_nullable']>().toEqualTypeOf<string | undefined>();

		assertType<Case>({ parent_id: { string_field: 'nested' } });
	});

	test('markers on core collection types map too (created_on is a datetime)', () => {
		type Case = NestedPartial<DirectusFile<TestSchema>>;

		expectTypeOf<Case['created_on']>().toEqualTypeOf<string | undefined>();

		assertType<Case>({ created_on: '2024-02-27T11:27:25+00:00' });
	});
});

describe('createItem / updateItem accept literal-typed field values (#21599)', () => {
	test('createItem and createItems accept the real values for marker fields', () => {
		createItem<TestSchema, 'collection_b', any>('collection_b', {
			json_field: { test: 'object' },
			csv_field: ['a', 'b'],
		});

		createItem<TestSchema, 'collection_c', any>('collection_c', {
			dt_field: '2024-02-27T11:27:25+00:00',
			date_field: '2024-02-27',
			time_field: '11:27:25',
		});

		createItems<TestSchema, 'collection_c', any>('collection_c', [{ dt_field: '2024-02-27T11:27:25+00:00' }]);
	});

	test('updateItem and updateItems accept the real values for marker fields', () => {
		updateItem<TestSchema, 'collection_c', any>('collection_c', 1, {
			dt_field: '2024-02-27T11:27:25+00:00',
		});

		updateItems<TestSchema, 'collection_b', any>('collection_b', [1], {
			json_field: { nested: { ok: true } },
		});
	});

	test('wrong value types are still rejected on create', () => {
		createItem<TestSchema, 'collection_c', any>('collection_c', {
			// @ts-expect-error dt_field is a string on input, not an object
			dt_field: { wrong: 'input' },
		});

		createItem<TestSchema, 'collection_b', any>('collection_b', {
			// @ts-expect-error csv_field is a string[] on input, not a single string
			csv_field: 'not an array',
		});
	});

	test('wrong value types are still rejected on update', () => {
		updateItem<TestSchema, 'collection_c', any>('collection_c', 1, {
			// @ts-expect-error dt_field is a string on input, not an object
			dt_field: { wrong: 'input' },
		});

		updateItem<TestSchema, 'collection_b', any>('collection_b', 1, {
			// @ts-expect-error json_field is a JsonValue, a bare function is not valid
			json_field: () => 'nope',
		});
	});
});
