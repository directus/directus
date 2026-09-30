import { writeFileSync } from 'fs';
import { join } from 'path';
import { SchemaBuilder } from '@directus/schema-builder';
import { getCallerFolder } from '@utils/getUID.js';

const schema = new SchemaBuilder({ test_schema: true })
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('users');
		c.field('tags').m2m('tags');
		c.field('links').o2m('links', 'article_id');
		c.field('blocks').m2a(['date_blocks', 'text_blocks']);
	})
	.collection('blogs', (c) => {
		c.field('id').id();
		c.field('blocks').m2a(['text_blocks']);
	})
	.collection('date_blocks', (c) => {
		c.field('id').id();
		c.field('date').date();
	})
	.collection('text_blocks', (c) => {
		c.field('id').id();
		c.field('text').text();
	})
	.collection('tags', (c) => {
		c.field('id').id();
		c.field('tag').string();
	})
	.collection('users', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('links', (c) => {
		c.field('id').id();
		c.field('link').string();
	});

export const snapshot = schema.snapshot();

writeFileSync(join(getCallerFolder(), 'schema.d.ts'), schema.types());
