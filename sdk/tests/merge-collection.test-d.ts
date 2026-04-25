import { assertType, describe, expectTypeOf, test } from 'vitest';
import type { MergeCoreCollection, RegularCollections, SingletonCollections } from '../src/index.js';

// https://directus.io/docs/tutorials/tips-and-tricks/advanced-types-with-the-directus-sdk#custom-fields-on-core-collections
type CustomUser = { loyalty_points: number };

type MySchema = {
	articles: { id: number; title: string }[];
	site_settings: { logo_url: string };
	directus_users: CustomUser; // singular = custom fields only
};

describe('SingletonCollections', () => {
	test('includes user-defined singleton collections', () => {
		expectTypeOf<SingletonCollections<MySchema>>().toEqualTypeOf<'site_settings'>();
	});

	test('excludes regular array collections', () => {
		// @ts-expect-error
		assertType<SingletonCollections<MySchema>>('articles');
	});

	test('excludes core collections defined as singular custom-field types', () => {
		// @ts-expect-error
		assertType<SingletonCollections<MySchema>>('directus_users');
	});
});

describe('RegularCollections', () => {
	test('includes user-defined array collections', () => {
		expectTypeOf<'articles'>().toExtend<RegularCollections<MySchema>>();
	});

	test('excludes user-defined singleton collections', () => {
		// @ts-expect-error
		assertType<RegularCollections<MySchema>>('site_settings');
	});
});

describe('MergeCoreCollection', () => {
	test('merges custom fields onto the builtin collection', () => {
		type MergedUser = MergeCoreCollection<MySchema, 'directus_users', { id: string; email: string | null }>;

		assertType<MergedUser>({ id: '1', email: 'a@b.com', loyalty_points: 42 });
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
