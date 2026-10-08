import { SchemaBuilder } from '@directus/schema-builder';

/** Every case-insensitive operator with the value its validation rule compares against */
export const RULES = {
	ieq: 'Alpha',
	nieq: 'Alpha',
	icontains: 'lph',
	nicontains: 'lph',
	istarts_with: 'alp',
	nistarts_with: 'alp',
	iends_with: 'pha',
	niends_with: 'pha',
} as const;

export const schema = new SchemaBuilder()
	.collection('words', (c) => {
		c.field('id').id();
		c.field('word').string();
	})
	.collection('validated', (c) => {
		c.field('id').id();

		for (const [operator, value] of Object.entries(RULES)) {
			c.field(operator)
				.string()
				.options({ validation: { [operator]: { [`_${operator}`]: value } } });
		}
	});

export const snapshot = schema.snapshot();
