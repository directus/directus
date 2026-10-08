import { describe, expect, test } from 'vitest';
import { SchemaBuilder } from './builder.js';
import { toTypeScript } from './typescript.js';

describe('types', () => {
	test('generates interfaces for collections and relations', () => {
		const types = new SchemaBuilder()
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('title').string().options({ nullable: false });
				c.field('published').dateTime();
				c.field('author').m2o('users');
				c.field('tags').m2m('tags');
				c.field('blocks').m2a(['text', 'image']);
			})
			.collection('settings', (c) => {
				c.field('id').uuid().primary();
				c.field('site-name').string();
			})
			.options({ singleton: true })
			.types();

		expect(types).toMatchInlineSnapshot(`
			"export interface Schema {
				articles: Articles[];
				settings: Settings;
				users: Users[];
				articles_tags_junction: ArticlesTagsJunction[];
				tags: Tags[];
				articles_blocks: ArticlesBlocks[];
				text: Text[];
				image: Image[];
			}

			export interface Articles {
				id: number;
				title: string;
				published: string | null;
				author: number | Users | null;
				tags: number[] | ArticlesTagsJunction[];
				blocks: number[] | ArticlesBlocks[];
			}

			export interface Settings {
				id: string;
				'site-name': string | null;
			}

			export interface Users {
				id: number;
			}

			export interface ArticlesTagsJunction {
				id: number;
				articles_id: number | Articles | null;
				tags_id: number | Tags | null;
			}

			export interface Tags {
				id: number;
			}

			export interface ArticlesBlocks {
				id: number;
				articles_id: number | Articles | null;
				item: string | Text | Image | null;
				collection: string | null;
			}

			export interface Text {
				id: number;
			}

			export interface Image {
				id: number;
			}
			"
		`);
	});

	test('maps field types', () => {
		const types = new SchemaBuilder()
			.collection('all_types', (c) => {
				c.field('id').id();
				c.field('boolean').boolean();
				c.field('big_integer').bigInteger();
				c.field('decimal').decimal();
				c.field('float').float();
				c.field('json').json();
				c.field('csv').csv();
				c.field('hash').hash();
				c.field('time').time();
				c.field('timestamp').timestamp();
				c.field('date').date();
			})
			.types();

		expect(types).toContain(`export interface AllTypes {
	id: number;
	boolean: boolean | null;
	big_integer: string | number | null;
	decimal: string | number | null;
	float: number | null;
	json: unknown;
	csv: string[] | null;
	hash: string | null;
	time: string | null;
	timestamp: string | null;
	date: string | null;
}`);
	});

	test('uses the related primary key type for relations', () => {
		const types = new SchemaBuilder()
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('translations').translations();
			})
			.types();

		expect(types).toContain('translations: number[] | ArticlesTranslations[];');
		expect(types).toContain('languages_code: string | Languages | null;');
	});

	test('supports a custom schema name', () => {
		const types = new SchemaBuilder()
			.collection('articles', (c) => {
				c.field('id').id();
			})
			.types({ schemaName: 'MySchema' });

		expect(types).toContain('export interface MySchema {');
	});
});

describe('toTypeScript', () => {
	test('generates the same types from a snapshot', () => {
		const builder = new SchemaBuilder().collection('articles', (c) => {
			c.field('id').id();
			c.field('author').m2o('users');
		});

		expect(toTypeScript(builder.snapshot())).toBe(builder.types());
	});

	test('skips folders and falls back for unknown related collections', () => {
		const types = toTypeScript({
			collections: [
				{ collection: 'folder', meta: null, schema: null },
				{ collection: '1st-collection', meta: null, schema: { name: '1st-collection' } },
			],
			fields: [
				{
					collection: '1st-collection',
					field: 'id',
					name: 'id',
					type: 'integer',
					meta: null,
					schema: { is_primary_key: true } as any,
				},
				{
					collection: '1st-collection',
					field: 'user',
					name: 'user',
					type: 'uuid',
					meta: null,
					schema: { is_nullable: true } as any,
				},
			],
			relations: [
				{
					collection: '1st-collection',
					field: 'user',
					related_collection: 'directus_users',
					meta: null,
					schema: null,
				},
			],
		});

		expect(types).toBe(`export interface Schema {
	'1st-collection': _1stCollection[];
}

export interface _1stCollection {
	id: number;
	user: string | number | null;
}
`);
	});

	test('uses string | number for union primary keys', () => {
		const types = new SchemaBuilder()
			.collection('articles', (c) => {
				c.field('id').bigInteger().primary();
				c.field('links').o2m('links', 'article_id');
			})
			.collection('links', (c) => {
				c.field('id').decimal().primary();
			})
			.types();

		expect(types).toContain('id: string | number;');
		expect(types).toContain('links: (string | number)[] | Links[];');
	});

	test('generates unique interface names', () => {
		const types = new SchemaBuilder()
			.collection('foo_bar', (c) => {
				c.field('id').id();
			})
			.collection('fooBar', (c) => {
				c.field('id').id();
			})
			.collection('schema', (c) => {
				c.field('id').id();
			})
			.types();

		expect(types).toContain('foo_bar: FooBar[];');
		expect(types).toContain('fooBar: FooBar2[];');
		expect(types).toContain('schema: Schema2[];');
		expect(types.match(/export interface Schema /g)).toHaveLength(1);
	});
});
