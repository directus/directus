import { describe, expect, it } from 'vitest';
import {
	exampleToSchema,
	getRootExtra,
	type OutputField,
	OutputSchemaError,
	schemaToFields,
	fieldsToSchema as toSchema,
} from './output-schema';

/** The written schema, typed loosely enough to read nested keys in assertions */
const fieldsToSchema = (...args: Parameters<typeof toSchema>) =>
	toSchema(...args) as { properties: Record<string, any>; required: string[] } & Record<string, unknown>;

const FIELDS: OutputField[] = [
	{ name: 'alt', type: 'string', description: 'Alt text' },
	{ name: 'mood', type: 'string', choices: ['calm', 'busy'], required: false },
	{ name: 'tags', type: 'strings' },
	{ name: 'scores', type: 'numbers' },
	{ name: 'ok', type: 'boolean' },
	{
		name: 'focal_point',
		type: 'object',
		fields: [
			{ name: 'x', type: 'number' },
			{ name: 'y', type: 'number' },
		],
	},
	{
		name: 'authors',
		type: 'objects',
		required: false,
		fields: [{ name: 'links', type: 'objects', fields: [{ name: 'url', type: 'string' }] }],
	},
];

const object = (properties: Record<string, unknown>) => ({
	type: 'object',
	properties,
	required: Object.keys(properties),
});

describe('fieldsToSchema', () => {
	it('lists every key as required and makes optional fields nullable with anyOf', () => {
		expect(fieldsToSchema(FIELDS)).toEqual(
			object({
				alt: { type: 'string', description: 'Alt text' },
				mood: { anyOf: [{ type: 'string', enum: ['calm', 'busy'] }, { type: 'null' }] },
				tags: { type: 'array', items: { type: 'string' } },
				scores: { type: 'array', items: { type: 'number' } },
				ok: { type: 'boolean' },
				focal_point: object({ x: { type: 'number' }, y: { type: 'number' } }),
				authors: {
					anyOf: [
						{ type: 'array', items: object({ links: { type: 'array', items: object({ url: { type: 'string' } }) } }) },
						{ type: 'null' },
					],
				},
			}),
		);
	});

	it('treats a missing type as text and skips rows without a name', () => {
		expect(fieldsToSchema([{ name: 'alt' }, { name: '' }])).toEqual(object({ alt: { type: 'string' } }));
	});

	it('rejects __proto__ as a field name', () => {
		expect(() => fieldsToSchema([{ name: '__proto__' }])).toThrow(OutputSchemaError);
	});

	it('drops keywords from the old type when a row changes type', () => {
		const rows = schemaToFields(
			object({
				tags: { type: 'array', items: { type: 'string', enum: ['a', 'b'] } },
				name: { type: 'string', maxLength: 40 },
			}),
		)!;

		const changed = rows.map((row) =>
			row.name === 'tags'
				? { ...row, type: 'objects' as const, fields: [{ name: 'label' }] }
				: { ...row, type: 'number' as const },
		);

		const schema = fieldsToSchema(changed);

		expect(schema.properties.tags.items).toEqual(object({ label: { type: 'string' } }));
		expect(schema.properties.name).toEqual({ type: 'number' });
		expect(fieldsToSchema(rows).properties.name).toEqual({ type: 'string', maxLength: 40 });
	});

	it.each(['constructor', 'toString'])('treats %s as a plain field name', (name) => {
		const schema = fieldsToSchema([{ name }]);

		expect(Object.keys(schema.properties)).toEqual([name]);
		expect(schema.required).toEqual([name]);
		expect(Object.getPrototypeOf(schema.properties)).toBe(Object.prototype);
	});

	it.each([
		['an unknown type', [{ name: 'a', type: 'date' as any }], 'unknown_type'],
		['an empty object', [{ name: 'a', type: 'object' as const, fields: [] }], 'empty_fields'],
		['a duplicate name', [{ name: 'a' }, { name: 'a', type: 'number' as const }], 'duplicate_name'],
		[
			'a duplicate nested name',
			[{ name: 'a', type: 'object' as const, fields: [{ name: 'b' }, { name: 'b' }] }],
			'duplicate_name',
		],
	])('rejects %s with a code the app can translate', (_, fields, code) => {
		expect(() => fieldsToSchema(fields)).toThrow(OutputSchemaError);

		try {
			fieldsToSchema(fields);
		} catch (error) {
			expect((error as OutputSchemaError).code).toBe(code);
		}
	});
});

describe('schemaToFields', () => {
	it('reads back the rows it wrote, and writing them again gives the same schema', () => {
		const schema = fieldsToSchema(FIELDS);
		const rows = schemaToFields(schema)!;

		expect(rows).toEqual(FIELDS);
		expect(fieldsToSchema(rows)).toEqual(schema);
	});

	it('reads a nullable type list as an optional field', () => {
		expect(schemaToFields(object({ a: { type: ['string', 'null'], enum: ['x', null] } }))).toEqual([
			{ name: 'a', type: 'string', choices: ['x'], required: false },
		]);
	});

	it('reads a pasted example with a list of text', () => {
		const rows = schemaToFields(exampleToSchema({ title: 'Title', tags: ['seo', 'ai'] }));

		expect(rows).toEqual([
			{ name: 'title', type: 'string', description: 'Title' },
			{ name: 'tags', type: 'strings' },
		]);
	});

	it('allows nesting up to the editor depth', () => {
		const deep = (levels: number): Record<string, unknown> =>
			levels === 0 ? { type: 'string' } : object({ a: deep(levels - 1) });

		expect(schemaToFields(deep(4))).not.toBeNull();
		expect(schemaToFields(deep(5))).toBeNull();
	});

	it('keeps keywords the rows do not edit, and writes them back unchanged', () => {
		const schema = {
			title: 'Product',
			additionalProperties: false,
			...object({
				name: { type: 'string', minLength: 2, maxLength: 80, description: 'Product name' },
				email: { type: 'string', format: 'email' },
				price: { type: 'number', minimum: 0, exclusiveMaximum: 10000 },
				rating: { type: 'integer', enum: [1, 2, 3, 4, 5] },
				sizes: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string', enum: ['s', 'm', 'l'] } },
				variants: {
					type: 'array',
					items: {
						additionalProperties: false,
						...object({ sku: { type: 'string', pattern: '^[A-Z]+$' } }),
					},
				},
			}),
		};

		const rows = schemaToFields(schema)!;

		expect(rows).not.toBeNull();

		expect(rows.find((row) => row.name === 'price')).toMatchObject({
			type: 'number',
			extra: { minimum: 0, exclusiveMaximum: 10000 },
		});

		expect(rows.find((row) => row.name === 'rating')).toMatchObject({
			type: 'integer',
			extra: { enum: [1, 2, 3, 4, 5] },
		});

		expect(fieldsToSchema(rows, getRootExtra(schema))).toEqual(schema);
	});

	it('reads a key left out of required as optional, and writes it back as nullable', () => {
		const rows = schemaToFields({ type: 'object', properties: { a: { type: 'string' } }, required: [] });

		expect(rows).toEqual([{ name: 'a', type: 'string', required: false }]);
		expect(fieldsToSchema(rows!).properties.a).toEqual({ anyOf: [{ type: 'string' }, { type: 'null' }] });
	});

	it('reads a schema with no fields yet as no rows, so fields can be added and removed', () => {
		expect(schemaToFields({ type: 'object', properties: {}, required: [] })).toEqual([]);
		expect(schemaToFields(fieldsToSchema([]))).toEqual([]);
		expect(schemaToFields(fieldsToSchema([{ name: '' }]))).toEqual([]);
	});

	it.each([
		['a field without a name', object({ '': { type: 'string' }, a: { type: 'string' } })],
		['a __proto__ field', { type: 'object', properties: JSON.parse('{"__proto__":{"type":"string"}}') }],
		['an empty choice', object({ a: { type: 'string', enum: ['', 'ready'] } })],
		['a union', object({ a: { type: ['string', 'number'] } })],
		['a ref', object({ a: { $ref: '#/$defs/a' } })],
		['oneOf', object({ a: { oneOf: [{ type: 'string' }, { type: 'number' }] } })],
		['a list of lists', object({ a: { type: 'array', items: { type: 'array' } } })],
		['a list of booleans', object({ a: { type: 'array', items: { type: 'boolean' } } })],
		['an object with no fields', object({ a: { type: 'object', properties: {} } })],
		['open objects', { ...object({ a: { type: 'string' } }), additionalProperties: true }],
		['an anyOf with two schemas', object({ a: { anyOf: [{ type: 'string' }, { type: 'number' }] } })],
		['a top-level array', { type: 'array', items: { type: 'string' } }],
		['nothing', null],
	])('returns null for %s', (_, schema) => {
		expect(schemaToFields(schema)).toBeNull();
	});
});

describe('exampleToSchema', () => {
	it('reads types from values and uses strings outside lists as descriptions', () => {
		expect(
			exampleToSchema({ alt: 'Alt text', x: 0, ok: true, tags: ['a tag'], empty: [], authors: [{ name: '' }] }),
		).toEqual(
			object({
				alt: { type: 'string', description: 'Alt text' },
				x: { type: 'number' },
				ok: { type: 'boolean' },
				tags: { type: 'array', items: { type: 'string' } },
				empty: { type: 'array', items: { type: 'string' } },
				authors: { type: 'array', items: object({ name: { type: 'string' } }) },
			}),
		);
	});

	it('names the path of a null value', () => {
		expect(() => exampleToSchema({ author: { name: null } })).toThrow('"example.author.name" is null');
	});
});
