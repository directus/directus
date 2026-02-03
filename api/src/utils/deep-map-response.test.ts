import { SchemaBuilder } from '@directus/schema-builder';
import { getRelation } from '@directus/utils';
import { expect, test } from 'vitest';
import { deepMapResponse } from './deep-map-response.js';

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('date').date();
		c.field('author').m2o('users');
		c.field('tags').m2m('tags');
		c.field('links').o2m('links', 'article_id');
		c.field('sections').m2a(['sec_num', 'sec_text']);
	})
	.collection('users', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('tags', (c) => {
		c.field('id').id();
		c.field('tag').string();
	})
	.collection('links', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('sec_num', (c) => {
		c.field('id').id();
		c.field('num').integer();
	})
	.collection('sec_text', (c) => {
		c.field('id').id();
		c.field('text').text();
	})
	.build();

test('map flat object', () => {
	const result = deepMapResponse(
		{
			id: 1,
			title: 2,
			author: 3,
			tags: [1, 2, 3],
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		id: {
			value: 1,
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['id'],
				relation: null,
				leaf: true,
				relationType: null,
			},
		},
		title: {
			value: 2,
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['title'],
				relation: null,
				leaf: true,
				relationType: null,
			},
		},
		author: {
			value: 3,
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['author'],
				relation: getRelation(schema.relations, 'articles', 'author'),
				leaf: true,
				relationType: 'm2o',
			},
		},
		tags: {
			value: [1, 2, 3],
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['tags'],
				relation: getRelation(schema.relations, 'articles', 'tags'),
				leaf: true,
				relationType: 'o2m',
			},
		},
	});
});

test('map m2o object', () => {
	const result = deepMapResponse(
		{
			author: {
				id: 1,
				name: 'hello',
			},
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		author: {
			value: {
				id: {
					value: 1,
					context: {
						collection: schema.collections['users'],
						field: schema.collections['users']!.fields['id'],
						relation: null,
						leaf: true,
						relationType: null,
					},
				},
				name: {
					value: 'hello',
					context: {
						collection: schema.collections['users'],
						field: schema.collections['users']!.fields['name'],
						relation: null,
						leaf: true,
						relationType: null,
					},
				},
			},
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['author'],
				relation: getRelation(schema.relations, 'articles', 'author'),
				leaf: false,
				relationType: 'm2o',
			},
		},
	});
});

test('map o2m object', () => {
	const result = deepMapResponse(
		{
			links: [
				{
					id: 1,
				},
				{
					name: 'hello',
				},
			],
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		links: {
			value: [
				{
					id: {
						value: 1,
						context: {
							collection: schema.collections['links'],
							field: schema.collections['links']!.fields['id'],
							relation: null,
							leaf: true,
							relationType: null,
						},
					},
				},
				{
					name: {
						value: 'hello',
						context: {
							collection: schema.collections['links'],
							field: schema.collections['links']!.fields['name'],
							relation: null,
							leaf: true,
							relationType: null,
						},
					},
				},
			],
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['links'],
				relation: getRelation(schema.relations, 'articles', 'links'),
				leaf: false,
				relationType: 'o2m',
			},
		},
	});
});

test('map m2m object', () => {
	const result = deepMapResponse(
		{
			tags: [
				{
					id: 1,
					articles_id: 2,
					tags_id: {
						tag: 'myTag',
					},
				},
			],
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		tags: {
			value: [
				{
					id: {
						value: 1,
						context: {
							collection: schema.collections['articles_tags_junction'],
							field: schema.collections['articles_tags_junction']!.fields['id'],
							relation: null,
							leaf: true,
							relationType: null,
						},
					},
					articles_id: {
						value: 2,
						context: {
							collection: schema.collections['articles_tags_junction'],
							field: schema.collections['articles_tags_junction']!.fields['articles_id'],
							relation: getRelation(schema.relations, 'articles_tags_junction', 'articles_id'),
							leaf: true,
							relationType: 'm2o',
						},
					},
					tags_id: {
						value: {
							tag: {
								value: 'myTag',
								context: {
									collection: schema.collections['tags'],
									field: schema.collections['tags']!.fields['tag'],
									relation: null,
									leaf: true,
									relationType: null,
								},
							},
						},
						context: {
							collection: schema.collections['articles_tags_junction'],
							field: schema.collections['articles_tags_junction']!.fields['tags_id'],
							relation: getRelation(schema.relations, 'articles_tags_junction', 'tags_id'),
							leaf: false,
							relationType: 'm2o',
						},
					},
				},
			],
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['tags'],
				relation: getRelation(schema.relations, 'articles', 'tags'),
				leaf: false,
				relationType: 'o2m',
			},
		},
	});
});

test('map m2a object', () => {
	const result = deepMapResponse(
		{
			sections: [
				{
					collection: 'sec_num',
					item: {
						num: 123,
					},
				},
				{
					collection: 'sec_text',
					item: {
						text: 'abc',
					},
				},
			],
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		sections: {
			value: [
				{
					collection: {
						value: 'sec_num',
						context: {
							collection: schema.collections['articles_builder'],
							field: schema.collections['articles_builder']!.fields['collection'],
							relation: null,
							leaf: true,
							relationType: null,
						},
					},
					item: {
						value: {
							num: {
								value: 123,
								context: {
									collection: schema.collections['sec_num'],
									field: schema.collections['sec_num']!.fields['num'],
									relation: null,
									leaf: true,
									relationType: null,
								},
							},
						},
						context: {
							collection: schema.collections['articles_builder'],
							field: schema.collections['articles_builder']!.fields['item'],
							relation: getRelation(schema.relations, 'articles_builder', 'item'),
							leaf: false,
							relationType: 'a2o',
						},
					},
				},
				{
					collection: {
						value: 'sec_text',
						context: {
							collection: schema.collections['articles_builder'],
							field: schema.collections['articles_builder']!.fields['collection'],
							relation: null,
							leaf: true,
							relationType: null,
						},
					},
					item: {
						value: {
							text: {
								value: 'abc',
								context: {
									collection: schema.collections['sec_text'],
									field: schema.collections['sec_text']!.fields['text'],
									relation: null,
									leaf: true,
									relationType: null,
								},
							},
						},
						context: {
							collection: schema.collections['articles_builder'],
							field: schema.collections['articles_builder']!.fields['item'],
							relation: getRelation(schema.relations, 'articles_builder', 'item'),
							leaf: false,
							relationType: 'a2o',
						},
					},
				},
			],
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['sections'],
				relation: getRelation(schema.relations, 'articles', 'sections'),
				leaf: false,
				relationType: 'o2m',
			},
		},
	});
});

test('map flat invalid field', () => {
	const result = deepMapResponse(
		{
			invalid: 1,
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		invalid: 1,
	});
});

test('map with invalid object', () => {
	expect(() => {
		deepMapResponse(
			new Date(),
			([key, value], context) => {
				return [key, { value, context }];
			},
			{ schema: schema, collection: 'articles' },
		);
	}).toThrowError();
});

test('map flat date value', () => {
	const date = new Date();

	const result = deepMapResponse(
		{ date },
		([key, value]) => {
			return [key, value];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({ date });
});

test('map flat invalid deep field', () => {
	const result = deepMapResponse(
		{
			author: {
				invalid: 1,
			},
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		author: {
			value: {
				invalid: 1,
			},
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['author'],
				relation: getRelation(schema.relations, 'articles', 'author'),
				leaf: false,
				relationType: 'm2o',
			},
		},
	});
});

test('map flat invalid deep field', () => {
	const result = deepMapResponse(
		{
			author: {
				invalid: 1,
			},
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		author: {
			value: {
				invalid: 1,
			},
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['author'],
				relation: getRelation(schema.relations, 'articles', 'author'),
				leaf: false,
				relationType: 'm2o',
			},
		},
	});
});

test('map m2a relation without collection field', () => {
	const callback = () =>
		deepMapResponse(
			{
				sections: [
					{
						item: {
							num: 123,
						},
					},
				],
			},
			([key, value], context) => {
				return [key, { value, context }];
			},
			{ schema: schema, collection: 'articles' },
		);

	expect(callback).toThrowError(
		"When selecting 'articles_builder.item', the field 'articles_builder.collection' has to be selected when using versioning and m2a relations",
	);
});
