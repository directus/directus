import { SchemaBuilder } from '@directus/schema-builder';

export const schema = new SchemaBuilder().collection('fields', (c) => {
	c.field('id').id();
});

export const snapshot = schema.snapshot({ test_schema: true });
