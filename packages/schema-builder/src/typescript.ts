import type { Type } from '@directus/types';
import type { SchemaSnapshot } from './schema-overview.js';

export type TypeScriptOptions = {
	/** Name of the root interface mapping collection names to their item types */
	schemaName?: string;
};

type SnapshotField = SchemaSnapshot['fields'][number];

const PRIMITIVE_TYPES: Partial<Record<Type, string>> = {
	boolean: 'boolean',
	integer: 'number',
	float: 'number',
	// Returned as strings by some database drivers
	bigInteger: 'string | number',
	decimal: 'string | number',
	string: 'string',
	text: 'string',
	hash: 'string',
	uuid: 'string',
	date: 'string',
	dateTime: 'string',
	time: 'string',
	timestamp: 'string',
	csv: 'string[]',
	json: 'unknown',
};

/**
 * Generates TypeScript interfaces for the collections in a schema snapshot, in the shape the Directus SDK expects.
 */
export function toTypeScript(snapshot: SchemaSnapshot, options: TypeScriptOptions = {}): string {
	const collections = snapshot.collections.filter((collection) => collection.schema);
	const schemaName = options.schemaName ?? 'Schema';

	// Distinct collections can map to the same type name (e.g. `foo_bar` and `fooBar`), which TypeScript would silently merge
	const usedNames = new Set([schemaName]);

	const names = new Map(
		collections.map(({ collection }) => {
			const base = toTypeName(collection);
			let name = base;

			for (let index = 2; usedNames.has(name); index++) name = `${base}${index}`;

			usedNames.add(name);
			return [collection, name];
		}),
	);

	// Index fields and relations once, so lookups don't rescan the whole snapshot
	const fieldsByCollection = new Map<string, SnapshotField[]>();
	const primaries = new Map<string, SnapshotField>();
	const manyRelations = new Map<string, SchemaSnapshot['relations'][number]>();
	const oneRelations = new Map<string, SchemaSnapshot['relations'][number]>();

	for (const field of snapshot.fields) {
		const fields = fieldsByCollection.get(field.collection) ?? [];
		fields.push(field);
		fieldsByCollection.set(field.collection, fields);

		if (field.schema?.is_primary_key && !primaries.has(field.collection)) primaries.set(field.collection, field);
	}

	for (const relation of snapshot.relations) {
		const manyKey = fieldKey(relation.collection, relation.field);
		if (!manyRelations.has(manyKey)) manyRelations.set(manyKey, relation);

		if (relation.meta?.one_collection && relation.meta.one_field) {
			const oneKey = fieldKey(relation.meta.one_collection, relation.meta.one_field);
			if (!oneRelations.has(oneKey)) oneRelations.set(oneKey, relation);
		}
	}

	const primaryType = (collection: string) => {
		const primary = primaries.get(collection);
		return primary ? primitiveType(primary) : 'string | number';
	};

	const relatedType = (collection: string, list = false) => {
		const suffix = list ? '[]' : '';

		if (!names.has(collection)) return list ? '(string | number)[]' : 'string | number';

		const primary = primaryType(collection);
		const key = list && primary.includes('|') ? `(${primary})` : primary;

		// The SDK resolves nested fields only for a union of arrays, not an array of unions
		return `${key}${suffix} | ${names.get(collection)}${suffix}`;
	};

	const fieldType = (field: SnapshotField): string => {
		const many = manyRelations.get(fieldKey(field.collection, field.field));

		if (many?.related_collection) {
			return nullable(relatedType(many.related_collection), field);
		}

		if (many?.meta?.one_allowed_collections) {
			const allowed = many.meta.one_allowed_collections.filter((collection) => names.has(collection));
			return nullable([primitiveType(field), ...allowed.map((collection) => names.get(collection))].join(' | '), field);
		}

		const one = oneRelations.get(fieldKey(field.collection, field.field));

		if (one) return relatedType(one.collection, true);

		if (field.schema?.is_primary_key) return primaryType(field.collection);

		return nullable(primitiveType(field), field);
	};

	const interfaces = collections.map(({ collection }) => {
		const properties = (fieldsByCollection.get(collection) ?? []).map(
			(field) => `\t${toPropertyName(field.field)}: ${fieldType(field)};`,
		);

		return [`export interface ${names.get(collection)} {`, ...properties, '}'].join('\n');
	});

	const schema = collections.map(({ collection, meta }) => {
		const type = meta?.singleton ? names.get(collection) : `${names.get(collection)}[]`;
		return `\t${toPropertyName(collection)}: ${type};`;
	});

	return [`export interface ${schemaName} {`, ...schema, '}', ...interfaces.map((item) => `\n${item}`), ''].join('\n');
}

function fieldKey(collection: string, field: string): string {
	return `${collection}\0${field}`;
}

function primitiveType(field: SnapshotField): string {
	if (field.type.startsWith('geometry')) return 'Record<string, any>';

	return PRIMITIVE_TYPES[field.type] ?? 'unknown';
}

function nullable(type: string, field: SnapshotField): string {
	if (type === 'unknown' || !field.schema || field.schema.is_primary_key || field.schema.is_nullable === false) {
		return type;
	}

	return `${type} | null`;
}

function toTypeName(collection: string): string {
	const name = collection
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean)
		.map((part) => part[0]!.toUpperCase() + part.slice(1))
		.join('');

	if (!name) return 'Collection';

	return /^[0-9]/.test(name) ? `_${name}` : name;
}

function toPropertyName(name: string): string {
	return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : `'${name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}
