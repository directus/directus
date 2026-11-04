/**
 * Converts between the field rows of the AI Text output editor and the JSON Schema stored on the operation.
 * The schema is the source of truth. Rows are another way to view and edit it.
 */

export type OutputFieldType =
	| 'string'
	| 'number'
	| 'integer'
	| 'boolean'
	| 'object'
	| 'strings'
	| 'numbers'
	| 'objects';

export interface OutputField {
	name: string;
	type?: OutputFieldType | null;
	/** Defaults to true. Optional fields may come back as null. */
	required?: boolean | null;
	description?: string | null;
	/** Allowed values for text fields */
	choices?: string[] | null;
	/** Contents of `object` and `objects` fields */
	fields?: OutputField[] | null;
	/** Schema keywords the rows don't edit, like `minimum` or `format`, written back unchanged */
	extra?: JsonSchema | null;
	/** The same for the item schema of a list */
	itemExtra?: JsonSchema | null;
	/** The type `extra` and `itemExtra` were read for. They're dropped if the row changes type. */
	extraFor?: OutputFieldType | null;
}

export type JsonSchema = Record<string, unknown>;

export const OUTPUT_FIELD_TYPES: OutputFieldType[] = [
	'string',
	'number',
	'integer',
	'boolean',
	'object',
	'strings',
	'numbers',
	'objects',
];

/** How deep the field editor nests. Deeper schemas can only be edited as JSON. */
export const OUTPUT_FIELD_MAX_DEPTH = 4;

export type OutputSchemaErrorCode =
	| 'unknown_type'
	| 'empty_fields'
	| 'duplicate_name'
	| 'reserved_name'
	| 'example_null';

/** Carries a code and values so the app can show the message in the user's language. */
export class OutputSchemaError extends Error {
	constructor(
		message: string,
		public code: OutputSchemaErrorCode,
		public params: Record<string, string>,
	) {
		super(message);
	}
}

/** Keywords the rows edit themselves. Anything else is kept as `extra`. */
const ROW_KEYS = new Set(['type', 'description', 'enum', 'properties', 'required', 'items']);

/** Keywords that change the shape in ways rows can't show. A schema using them can only be edited as JSON. */
const STRUCTURAL_KEYS = new Set([
	'$ref',
	'$defs',
	'definitions',
	'oneOf',
	'allOf',
	'anyOf',
	'not',
	'if',
	'then',
	'else',
	'patternProperties',
	'prefixItems',
	'dependentSchemas',
]);

/**
 * Every key is listed as required, because OpenAI's strict mode needs that. Optional fields can be null instead. They
 * use `anyOf` with null, not a type list, because Google's converter drops `items` and `properties` from type lists.
 * `rootExtra` carries top-level keywords like `title` over from the schema being edited.
 */
export function fieldsToSchema(fields: OutputField[], rootExtra: JsonSchema = {}): JsonSchema {
	const named = fields.filter((field) => field?.name);
	const names = new Set<string>();

	for (const { name } of named) {
		// Zod and the AI SDK drop this key from replies
		if (name === '__proto__') {
			throw new OutputSchemaError(`"${name}" can't be an output field name`, 'reserved_name', { name });
		}

		if (names.has(name)) {
			throw new OutputSchemaError(`Two output fields are named "${name}"`, 'duplicate_name', { name });
		}

		names.add(name);
	}

	// `fromEntries` makes own keys, so names like `__proto__` stay plain fields
	const properties = Object.fromEntries(named.map((field) => [field.name, fieldToSchema(field)]));

	return { ...rootExtra, type: 'object', properties, required: [...names] };
}

function fieldToSchema(field: OutputField): JsonSchema {
	const type = field.type ?? 'string';

	if (!OUTPUT_FIELD_TYPES.includes(type)) {
		throw new OutputSchemaError(`Output field "${field.name}" has unknown type "${type}"`, 'unknown_type', {
			name: field.name,
			type,
		});
	}

	let schema: JsonSchema;

	// Keywords like `maxLength` or an item `enum` only make sense for the type they were written for
	const sameType = !field.extraFor || field.extraFor === type;
	const extra = sameType ? field.extra : null;
	const itemExtra = sameType ? field.itemExtra : null;

	if (type === 'object' || type === 'objects') {
		const nested = (field.fields ?? []).filter((f) => f?.name);

		if (nested.length === 0) {
			throw new OutputSchemaError(`Output field "${field.name}" needs at least one field inside it`, 'empty_fields', {
				name: field.name,
			});
		}

		const object = fieldsToSchema(nested);
		schema = type === 'object' ? object : { type: 'array', items: { ...itemExtra, ...object } };
	} else if (type === 'strings' || type === 'numbers') {
		schema = { type: 'array', items: { ...itemExtra, type: type === 'strings' ? 'string' : 'number' } };
	} else {
		schema = { type };
	}

	schema = { ...extra, ...schema };

	const choices = type === 'string' ? (field.choices ?? []).filter(Boolean) : [];

	if (choices.length > 0) schema['enum'] = choices;
	if (field.description) schema['description'] = field.description;

	return field.required === false ? { anyOf: [schema, { type: 'null' }] } : schema;
}

/**
 * Rows for a schema, or null when the rows can't show it. Keywords the rows don't edit ride along in `extra`, so
 * writing the rows back gives the same schema, except that keys left out of `required` come back nullable.
 */
export function schemaToFields(schema: unknown): OutputField[] | null {
	if (!isObject(schema) || schema['type'] !== 'object' || hasStructuralKeys(schema)) return null;
	return propertiesToFields(schema, OUTPUT_FIELD_MAX_DEPTH, true);
}

/** Top-level keywords like `title`, to pass back to `fieldsToSchema` when the rows change. */
export function getRootExtra(schema: unknown): JsonSchema {
	return isObject(schema) ? pickExtra(schema) : {};
}

/** Only the top level can be empty, since that's where you start adding fields. */
function propertiesToFields(schema: JsonSchema, depth: number, root = false): OutputField[] | null {
	const additional = schema['additionalProperties'];
	if (additional !== undefined && additional !== false) return null;

	const properties = Object.entries<unknown>(isObject(schema['properties']) ? schema['properties'] : {});
	const required = Array.isArray(schema['required']) ? schema['required'] : [];

	if (properties.length === 0) return root ? [] : null;

	const fields: OutputField[] = [];

	for (const [name, property] of properties) {
		// Rows drop fields without a name, and can't write `__proto__`
		if (!name || name === '__proto__') return null;

		const field = schemaToField(name, property, depth);
		if (!field) return null;
		// Rows can't leave a key out, so a key that may be missing becomes one that may be null
		if (!required.includes(name)) field.required = false;
		fields.push(field);
	}

	return fields;
}

function schemaToField(name: string, property: unknown, depth: number): OutputField | null {
	const { schema, nullable } = unwrapNullable(property);
	if (!schema || hasStructuralKeys(schema)) return null;

	const { type, description, enum: choices, items } = schema;
	const field: OutputField = { name, type: null };

	if (type === 'string' || type === 'number' || type === 'integer' || type === 'boolean') {
		field.type = type;
	} else if (type === 'object' && depth > 1) {
		field.type = 'object';
		field.fields = propertiesToFields(schema, depth - 1);
	} else if (type === 'array' && isObject(items) && !hasStructuralKeys(items)) {
		if (items['type'] === 'string') field.type = 'strings';
		else if (items['type'] === 'number') field.type = 'numbers';
		else if (items['type'] === 'object' && depth > 1) {
			field.type = 'objects';
			field.fields = propertiesToFields(items, depth - 1);
		}

		// Rows rebuild only the item's type and object fields, so everything else on the item is kept
		const itemExtra = omit(items, ['type', 'properties', 'required']);
		if (field.type && Object.keys(itemExtra).length > 0) field.itemExtra = itemExtra;
	}

	if (!field.type || field.fields === null) return null;

	// Rows only offer choices for text. Allowed values on anything else are kept as they are.
	const extra = pickExtra(schema, field.type !== 'string');

	if (choices !== undefined && field.type === 'string') {
		const values = Array.isArray(choices) ? choices.filter((choice) => choice !== null) : [];
		// The choices input can't hold an empty string
		if (values.length === 0 || !values.every((c) => typeof c === 'string' && c)) return null;
		field.choices = values;
	}

	if (typeof description === 'string' && description) field.description = description;
	if (Object.keys(extra).length > 0) field.extra = extra;
	if (field.extra || field.itemExtra) field.extraFor = field.type;
	if (nullable) field.required = false;

	return field;
}

/** Reads both `anyOf: [schema, { type: 'null' }]` and `type: ['string', 'null']`. */
function unwrapNullable(property: unknown): { schema: JsonSchema | null; nullable: boolean } {
	if (!isObject(property)) return { schema: null, nullable: false };

	if (Array.isArray(property['anyOf'])) {
		const [first, second, ...rest] = property['anyOf'];
		const others = Object.keys(property).filter((key) => key !== 'anyOf');

		if (rest.length > 0 || others.length > 0 || !isNullSchema(second) || !isObject(first)) {
			return { schema: null, nullable: false };
		}

		return { schema: first, nullable: true };
	}

	if (Array.isArray(property['type'])) {
		const types = property['type'].filter((t: unknown) => t !== 'null');
		if (types.length !== 1 || types.length === property['type'].length) return { schema: null, nullable: false };
		return { schema: { ...property, type: types[0] }, nullable: true };
	}

	return { schema: property, nullable: false };
}

/**
 * A schema from a sample result. Strings become descriptions of text fields, except inside lists, where they're
 * sample values. The first item of a list sets the type of every item.
 */
export function exampleToSchema(example: unknown): JsonSchema {
	return exampleToSchemaAt(example, 'example', false);
}

function exampleToSchemaAt(example: unknown, path: string, inList: boolean): JsonSchema {
	if (typeof example === 'string')
		return example && !inList ? { type: 'string', description: example } : { type: 'string' };
	if (typeof example === 'number') return { type: 'number' };
	if (typeof example === 'boolean') return { type: 'boolean' };

	if (Array.isArray(example)) {
		return {
			type: 'array',
			items: example.length > 0 ? exampleToSchemaAt(example[0], `${path}[0]`, true) : { type: 'string' },
		};
	}

	if (example && typeof example === 'object') {
		const entries = Object.entries(example);

		return {
			type: 'object',
			properties: Object.fromEntries(
				entries.map(([key, value]) => [key, exampleToSchemaAt(value, `${path}.${key}`, false)]),
			),
			required: entries.map(([key]) => key),
		};
	}

	throw new OutputSchemaError(`"${path}" is null. Use a sample value so its type is clear`, 'example_null', { path });
}

function omit(schema: JsonSchema, keys: string[]): JsonSchema {
	return Object.fromEntries(Object.entries(schema).filter(([key]) => !keys.includes(key)));
}

function pickExtra(schema: JsonSchema, keepEnum = false): JsonSchema {
	return Object.fromEntries(
		Object.entries(schema).filter(([key]) => !ROW_KEYS.has(key) || (keepEnum && key === 'enum')),
	);
}

function hasStructuralKeys(schema: JsonSchema): boolean {
	return Object.keys(schema).some((key) => STRUCTURAL_KEYS.has(key));
}

function isObject(value: unknown): value is JsonSchema {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isNullSchema(value: unknown): boolean {
	return isObject(value) && value['type'] === 'null' && Object.keys(value).length === 1;
}
