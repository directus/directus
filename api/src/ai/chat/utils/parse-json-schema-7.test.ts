import { parseJsonSchema7 } from './parse-json-schema-7.js';
import { describe, expect, it } from 'vitest';

describe('parseJsonSchema7', () => {
	it('accepts a minimal object schema with properties and required', () => {
		const schema = {
			type: 'object',
			title: 'User',
			description: 'A user object',
			properties: {
				id: { type: 'string' },
				age: { type: 'integer' },
			},
			required: ['id'],
			additionalProperties: false,
		} as const;

		const out = parseJsonSchema7(schema);
		expect(out).toEqual(schema);
	});

	it('accepts union type arrays (e.g. ["string","null"])', () => {
		const schema = {
			type: ['string', 'null'],
			description: 'Nullable string',
			enum: ['a', 'b', null],
		} as const;

		const out = parseJsonSchema7(schema);
		expect(out).toEqual(schema);
	});

	it('accepts JSON Schema draft-07 $schema URL (https, no hash)', () => {
		const schema = {
			$schema: 'https://json-schema.org/draft-07/schema',
			type: 'object',
		} as const;

		const out = parseJsonSchema7(schema);
		expect(out).toEqual(schema);
	});

	it('accepts JSON Schema draft-07 $schema URL with trailing #', () => {
		const schema = {
			$schema: 'https://json-schema.org/draft-07/schema#',
			type: 'array',
			items: { type: 'number' },
		} as const;

		const out = parseJsonSchema7(schema);
		expect(out).toEqual(schema);
	});

	it('accepts presence of only definitions as a schema indicator', () => {
		const schema = {
			title: 'Defs only',
			definitions: {
				thing: { type: 'string' },
			},
		} as const;

		const out = parseJsonSchema7(schema);
		expect(out).toEqual(schema);
	});

	it('accepts presence of only $defs as a schema indicator', () => {
		const schema = {
			$defs: {
				value: { type: 'integer' },
			},
		} as const;

		const out = parseJsonSchema7(schema);
		expect(out).toEqual(schema);
	});

	it('accepts patternProperties and additionalProperties object', () => {
		const schema = {
			type: 'object',
			patternProperties: {
				'^x-': { type: 'string' },
			},
			additionalProperties: { type: 'number' },
		} as const;

		const out = parseJsonSchema7(schema);
		expect(out).toEqual(schema);
	});

	it('accepts items as an array for tuple validation', () => {
		const schema = {
			type: 'array',
			items: [{ type: 'string' }, { type: 'integer' }],
		} as const;

		const out = parseJsonSchema7(schema);
		expect(out).toEqual(schema);
	});

	it('accepts combinators (anyOf/allOf/oneOf/not) without validating nested content', () => {
		const schema = {
			anyOf: [{ type: 'string' }, { type: 'number' }],
			allOf: [{}, {}],
			oneOf: [{ const: 1 }, { const: 2 }],
			not: {},
		} as const;

		const out = parseJsonSchema7(schema);
		expect(out).toEqual(schema);
	});

	it('throws with a helpful message when $schema URL is not draft-07', () => {
		const bad = {
			$schema: 'https://json-schema.org/draft/2020-12/schema',
			type: 'object',
		} as const;

		expect(() => parseJsonSchema7(bad)).toThrowError(/Must be the JSON Schema Draft-07 meta-schema URL/);
	});

	it('throws when no schema keywords are present', () => {
		const bad = { title: 'Just a title', description: 'No schemaish keys' } as const;
		expect(() => parseJsonSchema7(bad)).toThrowError(/No schema keywords found/);
	});

	it('throws when type is not a valid JSON type (string or array of known types)', () => {
		const bad = { type: 'unknown-type' } as any;
		expect(() => parseJsonSchema7(bad)).toThrow();
	});
});
