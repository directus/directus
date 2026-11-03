import { SchemaBuilder } from '@directus/schema-builder';

export const schema = new SchemaBuilder()
	.collection('authors', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.options({ versioning: true })
	.collection('categories', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('tags', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.options({ versioning: true })
	.collection('text', (c) => {
		c.field('id').id();
		c.field('content').string();
	})
	.options({ versioning: true })
	.collection('images', (c) => {
		c.field('id').id();
		c.field('url').string();
	})
	.collection('notes', (c) => {
		c.field('id').id();
		c.field('text').string();
	})
	.options({ versioning: true })
	.collection('links', (c) => {
		c.field('id').id();
		c.field('url').string();
	})
	.collection('posts', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('views').integer();
		c.field('author').m2o('authors');
		c.field('category').m2o('categories');
		c.field('parent').m2o('posts');
		c.field('notes').o2m('notes', 'post_id');
		c.field('links').o2m('links', 'post_id');
		c.field('tags').m2m('tags');
		c.field('blocks').m2a(['text', 'images']);
		c.field('attachment').a2o(['text', 'images']);
		c.field('translations').translations();
	})
	.options({ versioning: true })
	.collection('posts_tags_junction', (c) => {
		c.field('id').id();
	})
	.options({ versioning: true })
	.collection('posts_blocks', (c) => {
		c.field('id').id();
	})
	.options({ versioning: true })
	.collection('posts_translations', (c) => {
		c.field('id').id();
		c.field('title').string();
	})
	.options({ versioning: true });

export const snapshot = schema.snapshot();
