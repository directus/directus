import { SchemaBuilder } from '@directus/schema-builder';
import { expect, test } from 'vitest';
import { filterToFields } from './filter-to-fields.js';

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
		c.field('follow').text();
		c.field('article_id').m2o('articles');
	})
	.build();

test('map flat filter', () => {
	const result = filterToFields(
		{
			id: {
				_eq: 1,
			},
			title: {
				_contains: 'Hello',
			},
			fake: {
				_eq: 'Should be ignored',
			},
		},
		'articles',
		schema,
	);

	expect(result).toEqual(['id', 'title']);
});

test('map m2o filter', () => {
	const result = filterToFields(
		{
			id: {
				_eq: 1,
			},
			author: {
				name: {
					_eq: 'John Doe',
				},
			},
		},
		'articles',
		schema,
	);

	expect(result).toEqual(['id', 'author.name']);
});

test('map o2m filter', () => {
	const result = filterToFields(
		{
			id: {
				_eq: 1,
			},
			links: {
				id: {
					_gt: 5,
				},
				name: {
					_eq: 'Link 1',
				},
			},
		},
		'articles',
		schema,
	);

	expect(result).toEqual(['id', 'links.id', 'links.name']);
});

test('map m2m filter', () => {
	const result = filterToFields(
		{
			id: {
				_eq: 1,
			},
			tags: {
				tags_id: {
					tag: {
						_eq: 'Tag 1',
					},
				},
			},
		},
		'articles',
		schema,
	);

	expect(result).toEqual(['id', 'tags.tags_id.tag']);
});

test('map m2a filter', () => {
	const result = filterToFields(
		{
			id: {
				_eq: 1,
			},
			sections: {
				'item:sec_num': {
					num: {
						_eq: 1,
					},
				},
				'item:sec_text': {
					text: {
						_eq: 'abc',
					},
				},
			},
		},
		'articles',
		schema,
	);

	expect(result).toEqual(['id', 'sections.item:sec_num.num', 'sections.item:sec_text.text']);
});

test('map $FOLLOW filter', () => {
	const result = filterToFields(
		{
			id: {
				_eq: 1,
			},
			'$FOLLOW(followable, article_id)': {
				follow: {
					_eq: 1,
				},
				invalid: {
					_eq: 'Should be ignored',
				},
			},
		},
		'articles',
		schema,
	);

	expect(result).toEqual(['id', '$FOLLOW(followable, article_id).follow']);
});
