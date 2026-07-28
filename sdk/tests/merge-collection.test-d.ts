import { assertType, describe, expectTypeOf, test } from 'vitest';
import type { MergeCoreCollection, RegularCollections, SingletonCollections } from '../src/index.js';
import type { TestSchema } from './schema.js';

describe('SingletonCollections', () => {
	test('includes user-defined singleton collections', () => {
		expectTypeOf<SingletonCollections<TestSchema>>().toEqualTypeOf<'user_defined_singleton'>();
	});

	test('excludes regular array collections', () => {
		// @ts-expect-error
		assertType<SingletonCollections<TestSchema>>('collection_a');
	});

	test('excludes core collections defined as singular custom-field types', () => {
		// @ts-expect-error
		assertType<SingletonCollections<TestSchema>>('directus_users');
	});
});

describe('RegularCollections', () => {
	test('includes user-defined array collections', () => {
		expectTypeOf<'collection_a'>().toExtend<RegularCollections<TestSchema>>();
	});

	test('excludes user-defined singleton collections', () => {
		// @ts-expect-error
		assertType<RegularCollections<TestSchema>>('user_defined_singleton');
	});
});

describe('MergeCoreCollection', () => {
	test('merges custom fields onto the builtin collection', () => {
		type MergedUser = MergeCoreCollection<TestSchema, 'directus_users', { id: string; email: string | null }>;

		assertType<MergedUser>({ id: '1', email: 'a@b.com', custom_field: true });
	});

	test('builtin fields cannot be overriden by custom core collection fields', () => {
		type MergedUser = MergeCoreCollection<TestSchema, 'directus_users', { id: string; email: string | null }>;

		expectTypeOf<MergedUser['id']>().toEqualTypeOf<string>();
		expectTypeOf<MergedUser['custom_field']>().toEqualTypeOf<boolean | undefined>();
	});

	test('custom fields absent when schema has no extension for that collection', () => {
		type SchemaWithoutUsers = { articles: { id: number }[] };
		type BaseUser = MergeCoreCollection<SchemaWithoutUsers, 'directus_users', { id: string; email: string | null }>;

		assertType<BaseUser>({ id: '1', email: 'a@b.com' });
	});

	test('falls back to builtin type when schema is any', () => {
		type AnyUser = MergeCoreCollection<any, 'directus_users', { id: string; email: string | null }>;

		assertType<AnyUser>({ id: '1', email: null });
	});
});
