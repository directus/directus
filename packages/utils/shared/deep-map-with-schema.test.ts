import { SchemaBuilder } from '@directus/schema-builder';
import { getRelation } from '@directus/utils';
import { expect, test } from 'vitest';
import { deepMapWithSchema } from './deep-map-with-schema.js';

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
		c.field('links').o2m('links', 'user_id');
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
				action: undefined,
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
				action: undefined,
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
				action: undefined,
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
				action: undefined,
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
						action: undefined,
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
						action: undefined,
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
				action: undefined,
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
							action: undefined,
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
							action: undefined,
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
				action: undefined,
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
								action: 'create',
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
								action: 'update',
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
				action: undefined,
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
							action: undefined,
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
							action: undefined,
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
									action: undefined,
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
							action: undefined,
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
				action: undefined,
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
							action: undefined,
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
									action: undefined,
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
							action: undefined,
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
							action: undefined,
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
									action: undefined,
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
							action: undefined,
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
				action: undefined,
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

test('map flat invalid deep field with onUnknownField', () => {
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
		{
			onUnknownField: ([key, value], context) => {
				return [key, { value, context }];
			},
		},
	);

	expect(result).toEqual({
		author: {
			value: {
				invalid: {
					value: 1,
					context: {
						collection: schema.collections['users'],
						object: object.author,
						action: undefined,
					},
				},
			},
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['author'],
				relation: getRelation(schema.relations, 'articles', 'author'),
				object,
				leaf: false,
				relationType: 'm2o',
				action: undefined,
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

test('map with non-existent fields', async () => {
	const object = {
		id: 1,
		title: 'hi',
		author: {
			id: 1,
		},
	};

	const result = await deepMapWithSchema(
		object,
		async ([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: simpleSchema, collection: 'articles' },
		{ mapNonExistentFields: true, processAsync: true },
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
				action: undefined,
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
				action: undefined,
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
						action: undefined,
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
						action: undefined,
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
				action: undefined,
			},
		},
	});
});

test('map primary key fields', () => {
	const object = {
		id: 2,
		title: 4,
		author: { id: 6 },
		links: [8, 10],
	};

	const result = deepMapWithSchema(
		object,
		([key, value], context) => {
			if (key === context.collection.primary && context.leaf) {
				return [key, Number(value) + 1];
			}

			return [key, value];
		},
		{ schema: schema, collection: 'articles' },
		{ mapPrimaryKeys: true },
	);

	expect(result).toEqual({
		id: 3,
		title: 4,
		author: { id: 7 },
		links: [9, 11],
	});
});

test('propagates root action context', () => {
	const object = { title: 'hello' };

	const result = deepMapWithSchema(
		object,
		([key, value], context) => {
			return [key, { value, context }];
		},
		{
			schema,
			collection: 'articles',
			relationInfo: {
				action: 'update',
			} as any,
		},
	);

	expect(result.title.context.action).toBe('update');
});

test('iterateOnly skips object reconstruction', () => {
	const object = { title: 'hello', author: { name: 'admin' } };
	let callCount = 0;

	const result = deepMapWithSchema(
		object,
		([key, value]) => {
			callCount++;
			return [key, value];
		},
		{ schema: schema, collection: 'articles' },
		{ iterateOnly: true },
	);

	expect(result).toBeUndefined();
	expect(callCount).toBe(3); // title, name, author
});

test('resets action context on M2O relations and propagates detailed syntax deep', () => {
	const object = {
		author: {
			name: 'admin',
			links: {
				create: [{ name: 'new-link' }],
				update: [{ id: 10, name: 'old-link' }],
				delete: [{ id: 5 }],
			},
		},
	};

	const result = deepMapWithSchema(
		object,
		([key, value], context) => {
			return [key, { value, context }];
		},
		{
			schema,
			collection: 'articles',
			relationInfo: { action: 'update' } as any,
		},
		{ detailedUpdateSyntax: true },
	);

	// Root action is update
	expect(result.author.context.action).toBe('update');

	// Inside M2O, action is reset to undefined (ambiguous link/update)
	expect(result.author.value.name.context.action).toBe(undefined);
	expect(result.author.value.links.context.action).toBe(undefined);

	// Inside O2M buckets, actions are explicit
	expect(result.author.value.links.value.create[0].name.context.action).toBe('create');
	expect(result.author.value.links.value.update[0].id.context.action).toBe('update');
	expect(result.author.value.links.value.delete[0].id.context.action).toBe('delete');
});

test('merges sync unknown fields in detailed syntax', () => {
	const object = {
		links: {
			create: [],
			update: [],
			delete: [],
			$type: 'sync-meta',
		},
	};

	const result = deepMapWithSchema(
		object,
		([key, value]) => [key, value],
		{ schema, collection: 'articles' },
		{
			detailedUpdateSyntax: true,
			onUnknownField: ([key, value]) => [key, value],
		},
	);

	expect(result).toEqual({
		links: {
			create: [],
			update: [],
			delete: [],
			$type: 'sync-meta',
		},
	});
});

test('merges async unknown fields in detailed syntax', async () => {
	const object = {
		links: {
			create: [],
			update: [],
			delete: [],
			$type: 'async-meta',
		},
	};

	const result = await deepMapWithSchema(
		object,
		async ([key, value]) => [key, value],
		{ schema, collection: 'articles' },
		{
			detailedUpdateSyntax: true,
			processAsync: true,
			onUnknownField: async ([key, value]) => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return [key, value];
			},
		},
	);

	expect(result).toEqual({
		links: {
			create: [],
			update: [],
			delete: [],
			$type: 'async-meta',
		},
	});
});
