import type { JSONSchema7 } from 'ai';

/**
 * Recursively sets `additionalProperties: false` on all object-type nodes.
 * OpenAI and Anthropic require this for structured output schemas.
 * Mirrors the SDK's internal `addAdditionalPropertiesToJsonSchema` which is not exported.
 */
export function addAdditionalPropertiesToJsonSchema(input: JSONSchema7): JSONSchema7 {
	const schema = structuredClone(input);
	return visit(schema);
}

function visit(schema: JSONSchema7): JSONSchema7 {
	if (schema.type === 'object' || (Array.isArray(schema.type) && schema.type.includes('object'))) {
		schema.additionalProperties = false;
	}

	if (schema.properties) {
		for (const key of Object.keys(schema.properties)) {
			const val = schema.properties[key];
			if (typeof val === 'object' && val !== null) schema.properties[key] = visit(val as JSONSchema7);
		}
	}

	if (schema.items) {
		if (Array.isArray(schema.items)) {
			schema.items = schema.items.map((item) =>
				typeof item === 'object' && item !== null ? visit(item as JSONSchema7) : item,
			);
		} else if (typeof schema.items === 'object') {
			schema.items = visit(schema.items as JSONSchema7);
		}
	}

	for (const key of ['anyOf', 'allOf', 'oneOf'] as const) {
		if (Array.isArray(schema[key])) {
			(schema as any)[key] = (schema[key] as JSONSchema7[]).map((s) =>
				typeof s === 'object' && s !== null ? visit(s) : s,
			);
		}
	}

	if (schema.definitions) {
		for (const key of Object.keys(schema.definitions)) {
			const val = schema.definitions[key];
			if (typeof val === 'object' && val !== null) schema.definitions[key] = visit(val as JSONSchema7);
		}
	}

	if ((schema as any)['$defs']) {
		for (const key of Object.keys((schema as any)['$defs'])) {
			const val = (schema as any)['$defs'][key];
			if (typeof val === 'object' && val !== null) (schema as any)['$defs'][key] = visit(val as JSONSchema7);
		}
	}

	return schema;
}
