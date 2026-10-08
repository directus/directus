import { SchemaBuilder } from '@directus/schema-builder';

export const schema = new SchemaBuilder()
	.collection('plants', (c) => {
		c.field('id').id();
		c.field('name').string();
		c.field('size').m2o('sizes');
	})
	.collection('sizes', (c) => {
		c.field('id').id();
		c.field('size').string();
	});

export const snapshot = schema.snapshot();
