import { writeFileSync } from 'fs';
import { join } from 'path';
import { SchemaBuilder } from '@directus/schema-builder';
import { getCallerFolder } from '@utils/getUID.js';

const schema = new SchemaBuilder({ test_schema: true })
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

writeFileSync(join(getCallerFolder(), 'schema.d.ts'), schema.types());
