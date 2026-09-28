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
	const names = new Map(collections.map(({ collection }) => [collection, toTypeName(collection)]));

	const fieldsOf = (collection: string) => snapshot.fields.filter((field) => field.collection === collection);

	const primaryType = (collection: string) => {
		const primary = fieldsOf(collection).find((field) => field.schema?.is_primary_key);
		return primary ? primitiveType(primary) : 'string | number';
	};

	const relatedType = (collection: string, list = false) => {
		const suffix = list ? '[]' : '';

		if (!names.has(collection)) return list ? '(string | number)[]' : 'string | number';

		// The SDK resolves nested fields only for a union of arrays, not an array of unions
		return `${primaryType(collection)}${suffix} | ${names.get(collection)}${suffix}`;
	};

	const fieldType = (field: SnapshotField): string => {
		const many = snapshot.relations.find(
			(relation) => relation.collection === field.collection && relation.field === field.field,
		);

		if (many?.related_collection) {
			return nullable(relatedType(many.related_collection), field);
		}

		if (many?.meta?.one_allowed_collections) {
			const allowed = many.meta.one_allowed_collections.filter((collection) => names.has(collection));
			return nullable([primitiveType(field), ...allowed.map((collection) => names.get(collection))].join(' | '), field);
		}

		const one = snapshot.relations.find(
			(relation) => relation.meta?.one_collection === field.collection && relation.meta.one_field === field.field,
		);

		if (one) return relatedType(one.collection, true);

		return nullable(primitiveType(field), field);
	};

	const interfaces = collections.map(({ collection }) => {
		const properties = fieldsOf(collection).map((field) => `\t${toPropertyName(field.field)}: ${fieldType(field)};`);

		return [`export interface ${names.get(collection)} {`, ...properties, '}'].join('\n');
	});

	const schema = collections.map(({ collection, meta }) => {
		const type = meta?.singleton ? names.get(collection) : `${names.get(collection)}[]`;
		return `\t${toPropertyName(collection)}: ${type};`;
	});

	return [
		`export interface ${options.schemaName ?? 'Schema'} {`,
		...schema,
		'}',
		...interfaces.map((item) => `\n${item}`),
		'',
	].join('\n');
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

	return /^[0-9]/.test(name) ? `_${name}` : name;
}

function toPropertyName(name: string): string {
	return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : `'${name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}
