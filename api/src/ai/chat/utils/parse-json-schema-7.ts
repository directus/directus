import type { JSONSchema7 } from 'ai';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

const jsonType = z.enum(['null', 'boolean', 'object', 'array', 'number', 'integer', 'string']);

const maybeDraft7Url = z.url({ protocol: /^https?$/, hostname: /^json-schema\.org$/ }).refine(
	(val) => {
		try {
			const u = new URL(val);
			return u.pathname === '/draft-07/schema' && (u.hash === '' || u.hash === '#');
		} catch {
			return false;
		}
	},
	{ message: 'Must be the JSON Schema Draft-07 meta-schema URL' },
);

const JsonSchema7 = z
	.object({
		$schema: maybeDraft7Url.optional(),
		$id: z.string().optional(),
		$ref: z.string().optional(),
		title: z.string().optional(),
		description: z.string().optional(),

		// common keywords
		type: z.union([jsonType, z.array(jsonType).nonempty()]).optional(),
		properties: z.record(z.string(), z.any()).optional(),
		required: z.array(z.string()).optional(),
		items: z.union([z.any(), z.array(z.any()).nonempty()]).optional(),
		additionalProperties: z.union([z.boolean(), z.any()]).optional(),
		patternProperties: z.record(z.string(), z.any()).optional(),
		enum: z.array(z.any()).optional(),
		const: z.any().optional(),
		anyOf: z.array(z.any()).optional(),
		allOf: z.array(z.any()).optional(),
		oneOf: z.array(z.any()).optional(),
		not: z.any().optional(),

		// draft-07 naming; accept both for tolerance
		definitions: z.record(z.string(), z.any()).optional(),
		$defs: z.record(z.string(), z.any()).optional(), // not draft-07, but appears in newer drafts
	})
	.refine(
		(obj) => {
			const keys = new Set(Object.keys(obj));

			const schemaish = [
				'type',
				'properties',
				'items',
				'required',
				'enum',
				'const',
				'anyOf',
				'allOf',
				'oneOf',
				'not',
				'$ref',
				'additionalProperties',
				'patternProperties',
				'definitions',
				'$defs',
			];

			return schemaish.some((k) => keys.has(k));
		},
		{ message: 'No schema keywords found' },
	);

/**
 * Checks whether an input object is *likely* a JSON Schema 7 object
 * Limitations:
 * - Does NOT validate nested schemas (e.g., inside `properties`, `items`, `definitions`, etc.)
 * - Does NOT check for correct usage of combinators (`anyOf`, `allOf`, `oneOf`, `not`)
 * - Does NOT verify required/optional keyword relationships (e.g., `required` only valid for object type)
 * - Does NOT validate formats, patterns, or constraints (e.g., `pattern`, `minimum`, `maximum`, etc.)
 * - Accepts both `definitions` and `$defs` for tolerance, but does not enforce draft-07 strictness
 * - Only checks for presence of top-level schema keywords
 * This is not a perfect validator, and does not check nested properties or full JSON Schema 7 compliance
 */
export const parseJsonSchema7 = (schema: unknown): JSONSchema7 => {
	const { success, error, data } = JsonSchema7.safeParse(schema);

	if (!success) {
		throw new Error(`Invalid JSON Schema passed: ${fromZodError(error).message}`);
	}

	return data as JSONSchema7;
};
