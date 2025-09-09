import { expect, test } from 'vitest';
import { deepMapWithSchema } from './deep-map-with-schema.js';
import { SchemaBuilder } from '@directus/schema-builder';
import { getRelation } from '@directus/utils';

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
	const object = {
		id: 1,
		title: 2,
		author: 3,
		tags: [1, 2, 3],
	};

	const result = deepMapWithSchema(
		object,
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
				object,
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
				object,
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
				object,
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
				object,
			},
		},
	});
});

test('map m2o object', () => {
	const object = {
		author: {
			id: 1,
			name: 'hello',
		},
	};

	const result = deepMapWithSchema(
		object,
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
						object: object.author,
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
						object: object.author,
					},
				},
			},
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['author'],
				relation: getRelation(schema.relations, 'articles', 'author'),
				leaf: false,
				object,
				relationType: 'm2o',
			},
		},
	});
});

test('map o2m object', () => {
	const object = {
		links: [
			{
				id: 1,
			},
			{
				name: 'hello',
			},
		],
	};

	const result = deepMapWithSchema(
		object,
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
							object: object.links[0],
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
							object: object.links[1],
						},
					},
				},
			],
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['links'],
				relation: getRelation(schema.relations, 'articles', 'links'),
				leaf: false,
				object,
				relationType: 'o2m',
			},
		},
	});
});

test('map o2m object with detailed syntax', () => {
	const object = {
		links: { create: [{ name: 'hello' }], update: [{ id: 1 }], delete: [] },
	};

	const result = deepMapWithSchema(
		object,
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
		{ detailedUpdateSyntax: true },
	);

	expect(result).toEqual({
		links: {
			value: {
				create: [
					{
						name: {
							value: 'hello',
							context: {
								collection: schema.collections['links'],
								field: schema.collections['links']!.fields['name'],
								relation: null,
								leaf: true,
								relationType: null,
								object: object.links.create[0],
							},
						},
					},
				],
				update: [
					{
						id: {
							value: 1,
							context: {
								collection: schema.collections['links'],
								field: schema.collections['links']!.fields['id'],
								relation: null,
								leaf: true,
								relationType: null,
								object: object.links.update[0],
							},
						},
					},
				],
				delete: [],
			},
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['links'],
				relation: getRelation(schema.relations, 'articles', 'links'),
				leaf: false,
				object,
				relationType: 'o2m',
			},
		},
	});
});

test('map m2m object', () => {
	const object = {
		tags: [
			{
				id: 1,
				articles_id: 2,
				tags_id: {
					tag: 'myTag',
				},
			},
		],
	};

	const result = deepMapWithSchema(
		object,
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
							object: object.tags[0],
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
							object: object.tags[0],
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
									object: object.tags[0]?.tags_id,
								},
							},
						},
						context: {
							collection: schema.collections['articles_tags_junction'],
							field: schema.collections['articles_tags_junction']!.fields['tags_id'],
							relation: getRelation(schema.relations, 'articles_tags_junction', 'tags_id'),
							leaf: false,
							relationType: 'm2o',
							object: object.tags[0],
						},
					},
				},
			],
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['tags'],
				relation: getRelation(schema.relations, 'articles', 'tags'),
				leaf: false,
				object,
				relationType: 'o2m',
			},
		},
	});
});

test('map m2a object', () => {
	const object = {
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
	};

	const result = deepMapWithSchema(
		object,
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
							object: object.sections[0],
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
									object: object.sections[0]?.item,
									relationType: null,
								},
							},
						},
						context: {
							collection: schema.collections['articles_builder'],
							field: schema.collections['articles_builder']!.fields['item'],
							relation: getRelation(schema.relations, 'articles_builder', 'item'),
							leaf: false,
							object: object.sections[0],
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
							object: object.sections[1],
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
									object: object.sections[1]?.item,
									relationType: null,
								},
							},
						},
						context: {
							collection: schema.collections['articles_builder'],
							field: schema.collections['articles_builder']!.fields['item'],
							relation: getRelation(schema.relations, 'articles_builder', 'item'),
							leaf: false,
							object: object.sections[1],
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
				object,
				relationType: 'o2m',
			},
		},
	});
});

test('map flat invalid field', () => {
	const result = deepMapWithSchema(
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
		deepMapWithSchema(
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

	const result = deepMapWithSchema(
		{ date },
		([key, value]) => {
			return [key, value];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({ date });
});

test('map flat invalid deep field', () => {
	const object = {
		author: {
			invalid: 1,
		},
	};

	const result = deepMapWithSchema(
		object,
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
				object,
				leaf: false,
				relationType: 'm2o',
			},
		},
	});
});

test('map flat invalid deep field', () => {
	const object = {
		author: {
			invalid: 1,
		},
	};

	const result = deepMapWithSchema(
		object,
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
				object,
				relationType: 'm2o',
			},
		},
	});
});

test('map m2a relation without collection field', () => {
	const callback = () =>
		deepMapWithSchema(
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

const simpleSchema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('users');
	})
	.collection('users', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.build();

test('map with non-existent fields', () => {
	const object = {
		id: 1,
		title: 'hi',
		author: {
			id: 1,
		},
	};

	const result = deepMapWithSchema(
		object,
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: simpleSchema, collection: 'articles' },
		{ mapNonExistentFields: true },
	);

	expect(result).toEqual({
		id: {
			value: 1,
			context: {
				collection: simpleSchema.collections['articles'],
				field: simpleSchema.collections['articles']!.fields['id'],
				relation: null,
				leaf: true,
				relationType: null,
				object,
			},
		},
		title: {
			value: 'hi',
			context: {
				collection: simpleSchema.collections['articles'],
				field: simpleSchema.collections['articles']!.fields['title'],
				relation: null,
				leaf: true,
				relationType: null,
				object,
			},
		},
		author: {
			value: {
				id: {
					value: 1,
					context: {
						collection: simpleSchema.collections['users'],
						field: simpleSchema.collections['users']!.fields['id'],
						relation: null,
						leaf: true,
						relationType: null,
						object: object.author,
					},
				},
				name: {
					value: undefined,
					context: {
						collection: simpleSchema.collections['users'],
						field: simpleSchema.collections['users']!.fields['name'],
						relation: null,
						leaf: true,
						relationType: null,
						object: object.author,
					},
				},
			},
			context: {
				collection: simpleSchema.collections['articles'],
				field: simpleSchema.collections['articles']!.fields['author'],
				relation: getRelation(simpleSchema.relations, 'articles', 'author'),
				leaf: false,
				relationType: 'm2o',
				object,
			},
		},
	});
});
