import { parseArgs } from 'node:util';
import { camelCase, kebabCase } from 'lodash-es';
import { z } from 'zod';
import { CliError } from '../error.js';

// We introspect the command's zod schema through its stable JSON-schema
// projection rather than poking zod internals — types, array item types, enum
// values, descriptions, and defaults all come from there.
interface JsonSchemaProp {
	type?: string;
	items?: { type?: string };
	enum?: readonly unknown[];
	default?: unknown;
	description?: string;
}

interface JsonSchemaObject {
	properties?: Record<string, JsonSchemaProp>;
	required?: readonly string[];
}

interface FieldMeta {
	readonly type: 'string' | 'number' | 'boolean' | 'array';
	readonly itemType: 'string' | 'number' | undefined;
	readonly description: string | undefined;
}

interface ArgSpec {
	readonly fields: Map<string, FieldMeta>;
	// camelCase keys the user must supply: required in the schema AND no default.
	readonly required: string[];
}

function fieldType(jsonType: string | undefined): FieldMeta['type'] {
	if (jsonType === 'boolean') return 'boolean';
	if (jsonType === 'number' || jsonType === 'integer') return 'number';
	if (jsonType === 'array') return 'array';
	return 'string';
}

function arrayItemType(prop: JsonSchemaProp): FieldMeta['itemType'] {
	if (prop.items?.type === 'number' || prop.items?.type === 'integer') return 'number';
	return 'string';
}

export function describeArgs(schema: z.ZodObject): ArgSpec {
	const json = z.toJSONSchema(schema) as unknown as JsonSchemaObject;
	const props = json.properties ?? {};
	const requiredInSchema = new Set(json.required ?? []);
	const fields = new Map<string, FieldMeta>();
	const required: string[] = [];

	for (const [key, prop] of Object.entries(props)) {
		const type = fieldType(prop.type);
		const itemType = type === 'array' ? arrayItemType(prop) : undefined;

		fields.set(key, {
			type,
			itemType,
			description: typeof prop.description === 'string' ? prop.description : undefined,
		});

		const hasDefault = Object.prototype.hasOwnProperty.call(prop, 'default');
		if (requiredInSchema.has(key) && !hasDefault) required.push(key);
	}

	return { fields, required };
}

function coerce(value: unknown, meta: FieldMeta | undefined): unknown {
	if (meta === undefined) return value;
	if (meta.type === 'number' && typeof value === 'string') return Number(value);

	if (meta.type === 'array' && meta.itemType === 'number' && Array.isArray(value)) {
		return (value as unknown[]).map((item) => (typeof item === 'string' ? Number(item) : item));
	}

	return value;
}

interface ParseSuccess<T> {
	readonly values: T;
	readonly positionals: string[];
}

export function parseCommandArgs<Schema extends z.ZodObject>(
	schema: Schema,
	argv: readonly string[],
): ParseSuccess<z.infer<Schema>> {
	const spec = describeArgs(schema);

	const options: Record<string, { type: 'string' | 'boolean'; multiple?: boolean }> = {};
	const flagToKey = new Map<string, string>();
	const booleanFlags = new Set<string>();

	for (const [key, meta] of spec.fields) {
		const flag = kebabCase(key);
		flagToKey.set(flag, key);

		if (meta.type === 'boolean') {
			options[flag] = { type: 'boolean' };
			booleanFlags.add(flag);
		} else if (meta.type === 'array') {
			options[flag] = { type: 'string', multiple: true };
		} else {
			options[flag] = { type: 'string' };
		}
	}

	// parseArgs has no native --no-<flag>; strip and record boolean negations.
	const negated = new Set<string>();
	const filtered: string[] = [];
	let passthrough = false;

	for (const token of argv) {
		// Tokens at/after a `--` terminator are literal positionals — leave them be.
		if (passthrough || token === '--') {
			if (token === '--') passthrough = true;
			filtered.push(token);
			continue;
		}

		const name = /^--no-(.+)$/.exec(token)?.[1];

		// Skip negation when `--no-x` is itself a registered flag (a `noX` field).
		if (name !== undefined && booleanFlags.has(name) && !flagToKey.has(token.slice(2))) {
			negated.add(name);
			continue;
		}

		filtered.push(token);
	}

	let parsed: { values: Record<string, unknown>; positionals: string[] };

	try {
		parsed = parseArgs({
			args: filtered,
			options,
			allowPositionals: true,
			strict: true,
		}) as { values: Record<string, unknown>; positionals: string[] };
	} catch (error) {
		throw new CliError('USAGE', error instanceof Error ? error.message : 'Invalid arguments');
	}

	// Assemble a camelCase object, coercing per field type. Unprovided keys are
	// omitted so the schema's own defaults / optionals apply.
	const raw: Record<string, unknown> = {};

	for (const [flag, value] of Object.entries(parsed.values)) {
		const key = flagToKey.get(flag) ?? camelCase(flag);
		raw[key] = coerce(value, spec.fields.get(key));
	}

	for (const flag of negated) {
		raw[flagToKey.get(flag) ?? camelCase(flag)] = false;
	}

	const result = schema.safeParse(raw);

	if (!result.success) throw new CliError('USAGE', z.prettifyError(result.error));

	return { values: result.data as z.infer<Schema>, positionals: parsed.positionals };
}
