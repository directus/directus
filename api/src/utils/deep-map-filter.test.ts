import { SchemaBuilder } from '@directus/schema-builder';
import { expect, test } from 'vitest';
import { deepMapFilter } from './deep-map-filter.js';
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
	.collection('followable', (c) => {
		c.field('id').id();
		c.field('article_id').m2o('articles');
	})
	.build();

test('map flat filter', () => {
	const result = deepMapFilter(
		{
			id: {
				_eq: 1,
			},
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		id: {
			value: {
				_eq: 1,
			},
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['id'],
				relation: null,
				object: {
					id: {
						_eq: 1,
					},
				},
				leaf: true,
				function: undefined,
				relationType: null,
			},
		},
	});
});

test('map m2o filter', () => {
	const result = deepMapFilter(
		{
			author: {
				name: {
					_eq: 'John Doe',
				},
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
				name: {
					value: {
						_eq: 'John Doe',
					},
					context: {
						collection: schema.collections['users'],
						field: schema.collections['users']!.fields['name'],
						relation: null,
						relationType: null,
						leaf: true,
						object: {
							name: {
								_eq: 'John Doe',
							},
						},
					},
				},
			},
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['author'],
				relation: getRelation(schema.relations, 'articles', 'author'),
				relationType: 'm2o',
				leaf: false,
				object: {
					author: {
						name: {
							_eq: 'John Doe',
						},
					},
				},
			},
		},
	});
});

test('map o2m filter', () => {
	const result = deepMapFilter(
		{
			links: {
				name: {
					_eq: 'Link 1',
				},
			},
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		links: {
			value: {
				name: {
					value: {
						_eq: 'Link 1',
					},
					context: {
						collection: schema.collections['links'],
						field: schema.collections['links']!.fields['name'],
						relation: null,
						relationType: null,
						leaf: true,
						object: {
							name: {
								_eq: 'Link 1',
							},
						},
					},
				},
			},
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['links'],
				relation: getRelation(schema.relations, 'articles', 'links'),
				relationType: 'o2m',
				leaf: false,
				function: undefined,
				object: {
					links: {
						name: {
							_eq: 'Link 1',
						},
					},
				},
			},
		},
	});
});

test('map m2a filter', () => {
	const result = deepMapFilter(
		{
			sections: {
				'item:sec_num': {
					num: {
						_eq: 1,
					},
				},
			},
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		sections: {
			value: {
				item: {
					value: {
						num: {
							value: {
								_eq: 1,
							},
							context: {
								collection: schema.collections['sec_num'],
								field: schema.collections['sec_num']!.fields['num'],
								relation: null,
								relationType: null,
								leaf: true,
								object: {
									num: {
										_eq: 1,
									},
								},
							},
						},
					},
					context: {
						collection: schema.collections['articles_builder'],
						field: schema.collections['articles_builder']!.fields['item'],
						relation: getRelation(schema.relations, 'articles_builder', 'item'),
						relationType: 'a2o',
						leaf: false,
						object: {
							'item:sec_num': {
								num: {
									_eq: 1,
								},
							},
						},
					},
				},
			},
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['sections'],
				relation: getRelation(schema.relations, 'articles', 'sections'),
				relationType: 'o2m',
				leaf: false,
				object: {
					sections: {
						'item:sec_num': {
							num: {
								_eq: 1,
							},
						},
					},
				},
			},
		},
	});
});

test('map _and filter', () => {
	const result = deepMapFilter(
		{
			_and: [
				{
					id: {
						_eq: 1,
					},
				},
				{
					title: {
						_eq: 'Test',
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
		_and: {
			value: [
				{
					id: {
						value: {
							_eq: 1,
						},
						context: {
							collection: schema.collections['articles'],
							field: schema.collections['articles']!.fields['id'],
							relation: null,
							relationType: null,
							leaf: true,
							object: {
								id: {
									_eq: 1,
								},
							},
						},
					},
				},
				{
					title: {
						value: {
							_eq: 'Test',
						},
						context: {
							collection: schema.collections['articles'],
							field: schema.collections['articles']!.fields['title'],
							relation: null,
							relationType: null,
							leaf: true,
							object: {
								title: {
									_eq: 'Test',
								},
							},
						},
					},
				},
			],
			context: {
				collection: schema.collections['articles'],
				field: null,
				relation: null,
				leaf: true,
				relationType: null,
				object: {
					_and: [
						{
							id: {
								_eq: 1,
							},
						},
						{
							title: {
								_eq: 'Test',
							},
						},
					],
				},
			},
		},
	});
});

test('map _some filter', () => {
	const result = deepMapFilter(
		{
			links: {
				_some: {
					name: {
						_eq: 'Link 1',
					},
				},
			},
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		links: {
			value: {
				_some: {
					value: {
						name: {
							value: {
								_eq: 'Link 1',
							},
							context: {
								collection: schema.collections['links'],
								field: schema.collections['links']!.fields['name'],
								relation: null,
								relationType: null,
								leaf: true,
								object: {
									name: {
										_eq: 'Link 1',
									},
								},
							},
						},
					},
					context: {
						collection: schema.collections['links'],
						field: null,
						relation: null,
						relationType: null,
						leaf: true,
						object: {
							_some: {
								name: {
									_eq: 'Link 1',
								},
							},
						},
					},
				},
			},
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['links'],
				relation: getRelation(schema.relations, 'articles', 'links'),
				relationType: 'o2m',
				leaf: false,
				function: undefined,
				object: {
					links: {
						_some: {
							name: {
								_eq: 'Link 1',
							},
						},
					},
				},
			},
		},
	});
});

test('map function filter', () => {
	const result = deepMapFilter(
		{
			'year(date)': {
				_eq: '2020',
			},
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		date: {
			value: {
				_eq: '2020',
			},
			context: {
				collection: schema.collections['articles'],
				field: schema.collections['articles']!.fields['date'],
				relation: null,
				object: {
					'year(date)': {
						_eq: '2020',
					},
				},
				leaf: true,
				function: 'year',
				relationType: null,
			},
		},
	});
});

test('map $FOLLOW filter', () => {
	const result = deepMapFilter(
		{
			'$FOLLOW(followable, article_id)': {
				id: {
					_eq: 1,
				},
			},
		},
		([key, value], context) => {
			return [key, { value, context }];
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toEqual({
		'$FOLLOW(followable, article_id)': {
			value: {
				id: {
					value: {
						_eq: 1,
					},
					context: {
						collection: schema.collections['followable'],
						field: schema.collections['followable']!.fields['id'],
						relation: null,
						relationType: null,
						leaf: true,
						object: {
							id: {
								_eq: 1,
							},
						},
					},
				},
			},
			context: {
				collection: schema.collections['articles'],
				field: null,
				relation: {
					collection: 'followable',
					field: 'article_id',
					related_collection: 'articles',
					schema: null,
					meta: null,
				},
				relationType: 'o2m',
				leaf: false,
				object: {
					'$FOLLOW(followable, article_id)': {
						id: {
							_eq: 1,
						},
					},
				},
			},
		},
	});
});
