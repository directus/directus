import { SchemaBuilder } from '@directus/schema-builder';

export const schema = new SchemaBuilder()
	.collection('city', (c) => {
		c.field('id').id();
		c.field('name').string();
		c.field('state').m2o('state');
	})
	.collection('country', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('state', (c) => {
		c.field('id').id();
		c.field('name').string();
		c.field('country').m2o('country');
	});

export const snapshot = schema.snapshot();
