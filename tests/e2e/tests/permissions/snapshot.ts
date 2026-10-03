import { writeFileSync } from 'fs';
import { join } from 'path';
import { SchemaBuilder } from '@directus/schema-builder';
import { getCallerFolder } from '@utils/getUID.js';

const schema = new SchemaBuilder({ test_schema: true })
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

writeFileSync(join(getCallerFolder(), 'schema.d.ts'), schema.types());
