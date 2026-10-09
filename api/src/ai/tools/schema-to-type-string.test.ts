import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { defineTool } from './define-tool.js';
import { getToolTypeStrings, schemaToTypeString } from './schema-to-type-string.js';

const toInputType = (schema: z.ZodType) => schemaToTypeString(z.toJSONSchema(schema, { io: 'input' }), 'Input');

describe('schemaToTypeString', () => {
	test('emits plain objects with descriptions', () => {
		const schema = z.object({
			title: z.string().describe('Human-readable title'),
			count: z.number(),
			published: z.boolean(),
		});

		expect(toInputType(schema)).toMatchInlineSnapshot(`
			"{
				/** Human-readable title */
				title: string;
				count: number;
				published: boolean;
			}"
		`);
	});

	test('uses input mode so defaults and optional fields are optional', () => {
		const schema = z.object({
			limit: z.number().default(100),
			search: z.string().optional(),
			collection: z.string(),
		});

		expect(toInputType(schema)).toMatchInlineSnapshot(`
			"{
				limit?: number;
				search?: string;
				collection: string;
			}"
		`);
	});

	test('emits enums and primitive unions', () => {
		const schema = z.object({
			status: z.enum(['draft', 'published']),
			key: z.union([z.string(), z.number()]),
			value: z.union([z.string(), z.null()]),
		});

		expect(toInputType(schema)).toMatchInlineSnapshot(`
			"{
				status: "draft" | "published";
				key: string | number;
				value: string | null;
			}"
		`);
	});

	test('emits discriminated unions', () => {
		const schema = z.discriminatedUnion('action', [
			z.object({
				action: z.literal('read'),
				keys: z.array(z.string()).optional(),
			}),
			z.object({
				action: z.literal('create'),
				data: z.object({
					title: z.string(),
				}),
			}),
		]);

		expect(toInputType(schema)).toMatchInlineSnapshot(`
			"{
				action: "read";
				keys?: string[];
			} | {
				action: "create";
				data: {
					title: string;
				};
			}"
		`);
	});

	test('emits arrays, records, nested objects, and quoted keys', () => {
		const schema = z.object({
			fields: z.array(z.string()),
			filter: z.record(z.string(), z.unknown()),
			nested: z.object({
				'field-name': z.string(),
			}),
		});

		expect(toInputType(schema)).toMatchInlineSnapshot(`
			"{
				fields: string[];
				filter: Record<string, unknown>;
				nested: {
					"field-name": string;
				};
			}"
		`);
	});

	test('emits tuples from prefix items', () => {
		const schema = z.object({
			point: z.tuple([z.number(), z.number()]),
		});

		expect(toInputType(schema)).toMatchInlineSnapshot(`
			"{
				point: [number, number];
			}"
		`);
	});

	test('emits catchall objects without invalid index signatures', () => {
		const schema = z.object({ id: z.string() }).catchall(z.number());

		expect(toInputType(schema)).toMatchInlineSnapshot(`
			"{
				id: string;
				[key: string]: number | string;
			}"
		`);
	});

	test('emits empty and object-shaped schemas as bare object shapes', () => {
		expect(
			schemaToTypeString(
				{
					type: 'object',
					additionalProperties: false,
				},
				'Input',
			),
		).toMatchInlineSnapshot(`"{}"`);

		expect(
			schemaToTypeString(
				{
					properties: {
						query: { type: 'string' },
					},
					required: ['query'],
				},
				'Input',
			),
		).toMatchInlineSnapshot(`
			"{
				query: string;
			}"
		`);
	});

	test('parenthesizes unions inside intersections', () => {
		expect(
			schemaToTypeString(
				{
					allOf: [
						{
							anyOf: [{ const: 'read' }, { const: 'create' }],
						},
						{
							type: 'object',
							properties: {
								id: { type: 'string' },
							},
							required: ['id'],
						},
					],
				},
				'Input',
			),
		).toMatchInlineSnapshot(`
			"("read" | "create") & {
				id: string;
			}"
		`);
	});

	test('emits boolean false schemas as never', () => {
		expect(schemaToTypeString(false, 'Input')).toBe('never');
	});

	test('resolves refs and defs without falling back to any', () => {
		const typeString = schemaToTypeString(
			{
				type: 'object',
				properties: {
					query: { $ref: '#/$defs/query' },
					items: {
						type: 'array',
						items: { $ref: '#/$defs/item' },
					},
				},
				required: ['query', 'items'],
				$defs: {
					item: {
						type: 'object',
						properties: {
							id: { type: 'string' },
						},
						required: ['id'],
					},
					query: {
						type: 'object',
						properties: {
							limit: { type: 'number' },
						},
						required: ['limit'],
					},
				},
			},
			'Input',
		);

		expect(typeString).not.toContain('any');

		expect(typeString).toMatchInlineSnapshot(`
			"interface Item {
				id: string;
			}

			interface Query {
				limit: number;
			}

			{
				query: Query;
				items: Item[];
			}"
		`);
	});

	test('uses type aliases for defs that cannot be interfaces', () => {
		expect(
			schemaToTypeString(
				{
					type: 'object',
					properties: {
						metadata: { $ref: '#/$defs/metadata' },
						maybeItem: { $ref: '#/$defs/maybe-item' },
					},
					required: ['metadata', 'maybeItem'],
					$defs: {
						metadata: {
							type: 'object',
							additionalProperties: { type: 'string' },
						},
						'maybe-item': {
							type: ['object', 'null'],
							properties: {
								id: { type: 'string' },
							},
							required: ['id'],
						},
					},
				},
				'Input',
			),
		).toMatchInlineSnapshot(`
			"type MaybeItem = {
				id: string;
			} | null;

			type Metadata = Record<string, string>;

			{
				metadata: Metadata;
				maybeItem: MaybeItem;
			}"
		`);
	});

	test('declares the root only when refs need the root name', () => {
		expect(
			schemaToTypeString(
				{
					type: 'object',
					properties: {
						parent: { $ref: '#' },
					},
				},
				'Input',
			),
		).toMatchInlineSnapshot(`
			"interface Input {
				parent?: Input;
			}"
		`);

		expect(
			schemaToTypeString(
				{
					type: 'object',
					properties: {
						item: { $ref: '#/$defs/item' },
					},
					$defs: {
						item: {
							type: 'object',
							properties: {
								root: { $ref: '#' },
							},
						},
					},
				},
				'Input',
			),
		).toMatchInlineSnapshot(`
			"interface Item {
				root?: Input;
			}

			interface Input {
				item?: Item;
			}"
		`);
	});

	test('disambiguates def names from declared root names', () => {
		expect(
			schemaToTypeString(
				{
					type: 'object',
					properties: {
						self: { $ref: '#' },
						input: { $ref: '#/$defs/input' },
					},
					$defs: {
						input: {
							type: 'object',
							properties: {
								value: { type: 'string' },
							},
						},
					},
				},
				'Input',
			),
		).toMatchInlineSnapshot(`
			"interface InputDef {
				value?: string;
			}

			interface Input {
				self?: Input;
				input?: InputDef;
			}"
		`);
	});

	test('resolves escaped def refs and falls back for missing defs', () => {
		expect(
			schemaToTypeString(
				{
					type: 'object',
					properties: {
						slashed: { $ref: '#/$defs/foo~1bar' },
						tilded: { $ref: '#/$defs/baz~0qux' },
						missing: { $ref: '#/$defs/missing' },
					},
					$defs: {
						'foo/bar': {
							type: 'object',
							properties: {
								id: { type: 'string' },
							},
						},
						'baz~qux': {
							type: 'object',
							properties: {
								key: { type: 'string' },
							},
						},
					},
				},
				'Input',
			),
		).toMatchInlineSnapshot(`
			"interface BazQux {
				key?: string;
			}

			interface FooBar {
				id?: string;
			}

			{
				slashed?: FooBar;
				tilded?: BazQux;
				missing?: unknown;
			}"
		`);
	});
});

describe('getToolTypeStrings', () => {
	test('emits and caches input and output type strings for a tool', () => {
		const output = z.object({
			data: z.array(z.object({ id: z.string() })),
		});

		const tool = defineTool<z.infer<typeof input>, z.infer<typeof output>>({
			name: 'test',
			description: 'Test tool',
			inputSchema: input,
			output,
			handler: async () => undefined,
		});

		const first = getToolTypeStrings(tool);
		const second = getToolTypeStrings(tool);

		expect(first).toBe(second);

		expect(first).toMatchInlineSnapshot(`
			{
			  "inputType": "{
				id: string;
				limit?: number;
			}",
			  "outputType": "{
				data: {
					id: string;
				}[];
			}",
			}
		`);
	});

	test('omits output type for tools without output schemas', () => {
		const tool = defineTool<z.infer<typeof input>>({
			name: 'test',
			description: 'Test tool',
			inputSchema: input,
			handler: async () => undefined,
		});

		expect(getToolTypeStrings(tool)).toEqual({
			inputType: `{
\tid: string;
\tlimit?: number;
}`,
		});
	});
});

const input = z.object({
	id: z.string(),
	limit: z.number().default(100),
});
