import { expect, test } from 'vitest';
import { SchemaBuilder } from './builder';

test('Create a basic schema', () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('title').string();
			c.field('content').text();
			c.field('published').dateTime();
		})
		.build();

	expect(schema).toEqual({
		collections: {
			articles: {
				accountability: 'all',
				collection: 'articles',
				fields: {
					content: {
						alias: false,
						dbType: 'text',
						defaultValue: null,
						field: 'content',
						generated: false,
						note: null,
						nullable: true,
						precision: null,
						scale: null,
						special: [],
						type: 'text',
						validation: null,
					},
					id: {
						alias: false,
						dbType: 'integer',
						defaultValue: 'AUTO_INCREMENT',
						field: 'id',
						generated: false,
						note: null,
						nullable: false,
						precision: null,
						scale: null,
						special: [],
						type: 'integer',
						validation: null,
					},
					published: {
						alias: false,
						dbType: 'timestamp without time zone',
						defaultValue: null,
						field: 'published',
						generated: false,
						note: null,
						nullable: true,
						precision: null,
						scale: null,
						special: [],
						type: 'dateTime',
						validation: null,
					},
					title: {
						alias: false,
						dbType: 'character varying',
						defaultValue: null,
						field: 'title',
						generated: false,
						note: null,
						nullable: true,
						precision: null,
						scale: null,
						special: [],
						type: 'string',
						validation: null,
					},
				},
				note: null,
				primary: 'id',
				singleton: false,
				sortField: null,
			},
		},
		relations: [],
	});
});
