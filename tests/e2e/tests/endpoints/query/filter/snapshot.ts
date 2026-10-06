import { SchemaBuilder } from '@directus/schema-builder';

export const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('users');
		c.field('tags').m2m('tags');
		c.field('links').o2m('links', 'article_id');
		c.field('blocks').m2a(['date_blocks', 'text_blocks']);
		c.field('votes').integer();
		c.field('release').dateTime();
	})
	.collection('date_blocks', (c) => {
		c.field('id').id();
		c.field('date').date();
	})
	.collection('text_blocks', (c) => {
		c.field('id').id();
		c.field('text').string();
	})
	.collection('tags', (c) => {
		c.field('id').id();
		c.field('tag').string();
	})
	.collection('users', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('links', (c) => {
		c.field('id').id();
		c.field('link').string();
	});

export const snapshot = schema.snapshot({ test_schema: true });
