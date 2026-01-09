import { SchemaBuilder } from '@directus/schema-builder';
import { expect, test } from 'vitest';
import { generateFilterValidator } from './generate-filter-validator.js';

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

test('filter id _eq: 1', () => {
	const validator = generateFilterValidator(
		{
			id: {
				_eq: 1,
			},
		},
		'articles',
		schema,
	);

	// console.log(JSON.stringify(validator.describe(), null, 2));

	expect(validator.validate({ id: 1 }).error).toBeUndefined();
	expect(validator.validate({ id: 2 }).error).toBeDefined();
	expect(validator.validate({}).error).toBeDefined();
	expect(validator.validate({ ignored: 1 }).error).toBeDefined();
});

test('filter _and with id and title', () => {
	const validator = generateFilterValidator(
		{
			_and: [
				{
					id: {
						_eq: 1,
					},
				},
				{
					title: {
						_contains: 'a',
					},
				},
			],
		},
		'articles',
		schema,
	);

	expect(validator.validate({ id: 1, title: 'a' }).error).toBeUndefined();
	expect(validator.validate({ id: 1, title: 'b' }).error).toBeDefined();
	expect(validator.validate({ id: 2, title: 'a' }).error).toBeDefined();
	expect(validator.validate({ id: 2, title: 'b' }).error).toBeDefined();
	expect(validator.validate({ id: 1 }).error).toBeDefined();
	expect(validator.validate({}).error).toBeDefined();
});

test('filter _or with id and title', () => {
	const validator = generateFilterValidator(
		{
			_or: [
				{
					id: {
						_eq: 1,
					},
				},
				{
					title: {
						_contains: 'a',
					},
				},
			],
		},
		'articles',
		schema,
	);

	expect(validator.validate({ id: 1, title: 'a' }).error).toBeUndefined();
	expect(validator.validate({ id: 1, title: 'b' }).error).toBeUndefined();
	expect(validator.validate({ id: 2, title: 'a' }).error).toBeUndefined();
	expect(validator.validate({ id: 2, title: 'b' }).error).toBeDefined();
	expect(validator.validate({ id: 1 }).error).toBeUndefined();
	expect(validator.validate({ id: 2 }).error).toBeDefined();
	expect(validator.validate({ title: 'a' }).error).toBeUndefined();
	expect(validator.validate({ title: 'b' }).error).toBeDefined();
	expect(validator.validate({}).error).toBeDefined();
});

test('filter m2o relation', () => {
	const validator = generateFilterValidator(
		{
			author: {
				id: {
					_eq: 1,
				},
			},
		},
		'articles',
		schema,
	);

	expect(validator.validate({ id: 1, title: 'a', author: { id: 1 } }).error).toBeUndefined();
	expect(validator.validate({ id: 1, title: 'a', author: { id: 2 } }).error).toBeDefined();
	expect(validator.validate({ author: {} }).error).toBeDefined();
	expect(validator.validate({ author: 1 }).error).toBeDefined();
	expect(validator.validate({}).error).toBeDefined();
});

test('filter o2m relation', () => {
	const validator = generateFilterValidator(
		{
			links: {
				name: {
					_contains: 'a',
				},
			},
		},
		'articles',
		schema,
	);

	expect(validator.validate({ links: [{ name: 'abc' }] }).error).toBeUndefined();
	expect(validator.validate({ links: [{ name: 'abc' }, { name: 'cba' }] }).error).toBeUndefined();
	expect(validator.validate({ links: [{ name: 'abc' }, { name: 'd' }] }).error).toBeDefined();
	expect(validator.validate({ links: [{ name: 'd' }] }).error).toBeDefined();
	expect(validator.validate({ links: [] }).error).toBeDefined();
});

test('filter _some on o2m relation', () => {
	const validator = generateFilterValidator(
		{
			links: {
				_some: {
					name: {
						_contains: 'a',
					},
				},
			},
		},
		'articles',
		schema,
	);

	expect(validator.validate({ links: [{ name: 'abc' }] }).error).toBeUndefined();
	expect(validator.validate({ links: [{ name: 'abc' }, { name: 'cba' }] }).error).toBeUndefined();
	expect(validator.validate({ links: [{ name: 'abc' }, { name: 'd' }] }).error).toBeUndefined();
	expect(validator.validate({ links: [{ name: 'd' }] }).error).toBeDefined();
	expect(validator.validate({ links: [{ name: 'd' }, { name: 'g' }] }).error).toBeDefined();
	expect(validator.validate({ links: [{ no: 'a' }] }).error).toBeDefined();
	expect(validator.validate({ links: [] }).error).toBeDefined();
});

test('filter _none on o2m relation', () => {
	const validator = generateFilterValidator(
		{
			links: {
				_none: {
					name: {
						_contains: 'a',
					},
				},
			},
		},
		'articles',
		schema,
	);

	expect(validator.validate({ links: [{ name: 'abc' }] }).error).toBeDefined();
	expect(validator.validate({ links: [{ name: 'bc' }, { name: 'gab' }] }).error).toBeDefined();
	expect(validator.validate({ links: [{ name: 'bc' }, { name: 'gb' }] }).error).toBeUndefined();
	expect(validator.validate({ links: [] }).error).toBeUndefined();
	expect(validator.validate({ links: [{ no: 'a' }] }).error).toBeUndefined();
});

test('filter on m2m relation', () => {
	const validator = generateFilterValidator(
		{
			tags: {
				tag_id: {
					tag: {
						_contains: 'a',
					},
				},
			},
		},
		'articles',
		schema,
	);

	expect(validator.validate({ tags: [{ tag_id: { tag: 'abc' } }] }).error).toBeUndefined();
	expect(validator.validate({ tags: [{ tag_id: { tag: 'g' } }] }).error).toBeDefined();
	expect(validator.validate({ tags: [{ tag_id: 1 }] }).error).toBeDefined();
	expect(validator.validate({ tags: [{ id: 1 }] }).error).toBeDefined();
	expect(validator.validate({ tags: [] }).error).toBeDefined();
});

test('filter on m2a relation', () => {
	const validator = generateFilterValidator(
		{
			sections: {
				'item:sec_num': {
					num: {
						_gt: 5,
					},
				},
			},
		},
		'articles',
		schema,
	);

	expect(validator.validate({ sections: [{ collection: 'sec_num', item: { num: 6 } }] }).error).toBeUndefined();

	expect(
		validator.validate({
			sections: [
				{ collection: 'sec_num', item: { num: 6 } },
				{ collection: 'sec_text', item: { text: 'abc' } },
			],
		}).error,
	).toBeUndefined();

	expect(
		validator.validate({
			sections: [
				{ collection: 'sec_num', item: { num: 4 } },
				{ collection: 'sec_text', item: { text: 'abc' } },
			],
		}).error,
	).toBeDefined();
});
