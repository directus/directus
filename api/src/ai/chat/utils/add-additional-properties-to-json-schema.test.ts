import { describe, expect, it } from 'vitest';
import { addAdditionalPropertiesToJsonSchema } from './add-additional-properties-to-json-schema.js';

describe('addAdditionalPropertiesToJsonSchema', () => {
	it('adds additionalProperties: false to a flat object', () => {
		const result = addAdditionalPropertiesToJsonSchema({
			type: 'object',
			properties: { name: { type: 'string' } },
			required: ['name'],
		});

		expect(result.additionalProperties).toBe(false);
	});

	it('adds to nested objects in properties', () => {
		const result = addAdditionalPropertiesToJsonSchema({
			type: 'object',
			properties: {
				address: {
					type: 'object',
					properties: { city: { type: 'string' } },
				},
			},
		});

		expect(result.additionalProperties).toBe(false);
		expect((result.properties!['address'] as any).additionalProperties).toBe(false);
	});

	it('adds to objects inside array items', () => {
		const result = addAdditionalPropertiesToJsonSchema({
			type: 'array',
			items: {
				type: 'object',
				properties: { id: { type: 'number' } },
			},
		});

		expect((result.items as any).additionalProperties).toBe(false);
	});

	it('adds to objects inside anyOf/allOf/oneOf', () => {
		const result = addAdditionalPropertiesToJsonSchema({
			anyOf: [{ type: 'object', properties: { a: { type: 'string' } } }, { type: 'string' }],
		});

		expect((result.anyOf![0] as any).additionalProperties).toBe(false);
	});

	it('adds to objects inside definitions', () => {
		const result = addAdditionalPropertiesToJsonSchema({
			type: 'object',
			properties: {},
			definitions: {
				Thing: { type: 'object', properties: { x: { type: 'number' } } },
			},
		});

		expect((result.definitions!['Thing'] as any).additionalProperties).toBe(false);
	});

	it('overwrites existing additionalProperties value', () => {
		const result = addAdditionalPropertiesToJsonSchema({
			type: 'object',
			properties: {},
			additionalProperties: true,
		});

		expect(result.additionalProperties).toBe(false);
	});

	it('does not add to non-object schemas', () => {
		const result = addAdditionalPropertiesToJsonSchema({
			type: 'string',
			enum: ['a', 'b'],
		});

		expect(result.additionalProperties).toBeUndefined();
	});

	it('does not mutate the original input', () => {
		const input = {
			type: 'object' as const,
			properties: { name: { type: 'string' as const } },
		};

		addAdditionalPropertiesToJsonSchema(input);
		expect(input.additionalProperties).toBeUndefined();
	});
});
