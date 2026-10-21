import { SchemaBuilder } from '@directus/schema-builder';

export const schema = new SchemaBuilder()
	.collection('categories', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('operators', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('singleton', (c) => {
		c.field('id').id();
		c.field('title').string();
	})
	.options({ singleton: true })
	.collection('tracks', (c) => {
		c.field('id').id();
		c.field('from').string();
		c.field('to').string();
	})
	.collection('trains', (c) => {
		c.field('id').id();
		c.field('name').string();
		c.field('operators').m2m('operators');
		c.field('tracks').o2m('tracks', 'train_id');
		c.field('category').m2o('categories');
	});

export const snapshot = schema.snapshot();
