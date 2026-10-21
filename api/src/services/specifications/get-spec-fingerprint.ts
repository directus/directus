import type { Permission, SchemaOverview } from '@directus/types';
import { version } from 'directus/version';
import type { TagObject } from 'openapi3-ts/oas30';

/**
 * Builds a deterministic representation of the inputs that affect OpenAPI generation.
 *
 * Keep this in sync with the inputs consumed by generateTags, generatePaths,
 * generateComponents, and generateField. Changes to any generator input that can
 * affect the resulting spec should also be reflected here.
 *
 * @param schema The permission-filtered schema available to the current user.
 * @param permissions The current user's permissions, including actions for readable collections.
 * @param tags The generated OpenAPI tags, including system tags used to represent auth level.
 *
 * @returns A deterministic string suitable for hashing as the spec fingerprint.
 */
export function getSpecFingerprint(schema: SchemaOverview, permissions: Permission[], tags: TagObject[] = []): string {
	// Sort collection and field names as schema order is not guaranteed
	const collections = Object.keys(schema.collections)
		.sort()
		.map((name) => {
			const collection = schema.collections[name]!;

			const fields = Object.keys(collection.fields)
				.sort()
				.map((key) => {
					const field = collection.fields[key]!;
					return [field.field, field.type, field.nullable, field.note, field.defaultValue, field.generated];
				});

			return [collection.collection, collection.note, collection.singleton, collection.primary, fields];
		});

	// Relations are uniquely identified by collection + field, so those fields
	// provide a stable ordering independent of the order returned by the database.
	const relations = schema.relations
		.map(
			(relation) =>
				[
					relation.collection,
					relation.field,
					relation.related_collection,
					relation.meta?.one_field,
					relation.meta?.one_collection_field,
					relation.meta?.one_allowed_collections,
				] as const,
		)
		.sort(([collectionA, fieldA], [collectionB, fieldB]) => {
			if (collectionA !== collectionB) return collectionA < collectionB ? -1 : 1;
			if (fieldA !== fieldB) return fieldA < fieldB ? -1 : 1;
			return 0;
		});

	// Schema only reflects read access, but the spec also shows CUD, include the permission actions as inference
	// Collections missing from the schema get no paths, so their permissions are skipped
	const actions = [
		...new Set(
			permissions
				.filter(({ collection }) => collection in schema.collections)
				.map(({ collection, action }) => `${collection}:${action}`),
		),
	].sort();

	// Tags without a collection (e.g. Utilities) are included based on accountability, and cannot be inferred elsewhere.
	const systemTags = tags
		.filter((tag) => !tag['x-collection'])
		.map((tag) => tag.name)
		.sort();

	return JSON.stringify([version, systemTags, collections, relations, actions]);
}
