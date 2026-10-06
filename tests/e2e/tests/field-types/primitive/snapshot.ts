import { writeFileSync } from 'fs';
import { join } from 'path';
import { SchemaBuilder } from '@directus/schema-builder';
import { getCallerFolder } from '@utils/getUID.js';

const schema = new SchemaBuilder().collection('fields', (c) => {
	c.field('id').id();
	c.field('string').string();
	c.field('uuid').uuid();
	c.field('big_integer').bigInteger();
	c.field('integer').integer();
	c.field('float').float();
	c.field('decimal').decimal().options({ precision: 10, scale: 5 });
	c.field('text').text();
	c.field('boolean').boolean();
	c.field('date').date();
	c.field('time').time();
	c.field('date_time').dateTime();
	c.field('timestamp').timestamp();
	c.field('hash').hash();
});

export const snapshot = schema.snapshot({ test_schema: true });

writeFileSync(join(getCallerFolder(), 'schema.d.ts'), schema.types());
