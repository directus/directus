import { SchemaBuilder } from '@directus/schema-builder';

export const schema = new SchemaBuilder()
	.collection('categories', (c) => {
		c.field('id').id();
		c.field('name').string();

		c.field('metadata')
			.json()
			.options({ special: ['cast-json'] });

		c.field('department_id').m2o('departments');
		c.field('products').o2m('products', 'category_id');
	})
	.collection('circles', (c) => {
		c.field('id').id();
		c.field('name').string();

		c.field('metadata')
			.json()
			.options({ special: ['cast-json'] });
	})
	.collection('departments', (c) => {
		c.field('id').id();
		c.field('name').string();

		c.field('metadata')
			.json()
			.options({ special: ['cast-json'] });
	})
	.collection('products', (c) => {
		c.field('id').id();
		c.field('name').string();

		c.field('metadata')
			.json()
			.options({ special: ['cast-json'] });

		c.field('data')
			.json()
			.options({ special: ['cast-json'] });

		c.field('suppliers').m2m('suppliers');
	})
	.collection('shapes', (c) => {
		c.field('id').id();
		c.field('name').string();
		c.field('children').m2a(['circles', 'squares']);
	})
	.collection('squares', (c) => {
		c.field('id').id();
		c.field('name').string();

		c.field('metadata')
			.json()
			.options({ special: ['cast-json'] });
	})
	.collection('suppliers', (c) => {
		c.field('id').id();
		c.field('name').string();

		c.field('metadata')
			.json()
			.options({ special: ['cast-json'] });
	});

export const snapshot = schema.snapshot({ test_schema: true });
