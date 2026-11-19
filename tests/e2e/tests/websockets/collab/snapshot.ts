import { SchemaBuilder } from '@directus/schema-builder';

export const schema = new SchemaBuilder()
	.collection('a2o', (c) => {
		c.field('id').uuid().primary();
		c.field('name').string();
		c.field('field_a').string();
		c.field('field_b').string();
	})
	.collection('deep', (c) => {
		c.field('id').uuid().primary();
		c.field('name').string();
		c.field('field_a').string();
		c.field('field_b').string();
	})
	.collection('items', (c) => {
		c.field('id').uuid().primary();
		c.field('title').string();
		c.field('content').text();
		c.field('notes').text();
	})
	.options({ versioning: true })
	.collection('m2m', (c) => {
		c.field('id').uuid().primary();
		c.field('name').string();
		c.field('field_a').string();
		c.field('field_b').string();
	})
	.collection('m2o', (c) => {
		c.field('id').uuid().primary();
		c.field('name').string();
		c.field('field_a').string();
		c.field('field_b').string();
	})
	.collection('o2m', (c) => {
		c.field('id').uuid().primary();
		c.field('name').string();
		c.field('field_a').string();
		c.field('field_b').string();
		c.field('deep_o2m_related').o2m('deep', 'parent_id');
	})
	.collection('private', (c) => {
		c.field('id').uuid().primary();
		c.field('secret').string();
	})
	.collection('relational', (c) => {
		c.field('id').uuid().primary();
		c.field('name').string();
		c.field('m2o_related').m2o('m2o');
		c.field('o2m_related').o2m('o2m', 'parent_id');
		c.field('m2m_related').m2m('m2m', 'parents');
		c.field('a2o_items').m2a(['a2o', 'm2o']);
	})
	.collection('singleton', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('confidential').string();
		c.field('is_published').boolean();
	})
	.options({ singleton: true });

export const snapshot = schema.snapshot();
