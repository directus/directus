import { SchemaBuilder } from '@directus/schema-builder';

export const schema = new SchemaBuilder()
	.collection('authors', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('editors', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('authors', undefined, (r) => r.options({ schema: { on_delete: 'CASCADE' } }));
		c.field('editor').m2o('editors', undefined, (r) => r.options({ schema: { on_delete: 'CASCADE' } }));
	});

export const snapshot = schema.snapshot();
