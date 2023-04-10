import type { Permission, PermissionsAction, SchemaOverview } from '@directus/types';
import { uniq } from 'lodash-es';

/**
 * Reduces the schema based on the included permissions. The resulting object is the schema structure, but with only
 * the allowed collections/fields/relations included based on the permissions.
 * @param schema The full project schema
 * @param actions Array of permissions actions (crud)
 * @returns Reduced schema
 */
export function reduceSchema(
	schema: SchemaOverview,
	permissions: Permission[] | null,
	actions: PermissionsAction[] = ['create', 'read', 'update', 'delete']
): SchemaOverview {
	const reduced: SchemaOverview = {
		collections: {},
		relations: [],
	};

	const allowedFieldsInCollection =
		permissions
			?.filter((permission) => actions.includes(permission.action))
			.reduce((acc, permission) => {
				if (!acc[permission.collection]) {
					acc[permission.collection] = [];
				}

				if (permission.fields) {
					acc[permission.collection] = uniq([...acc[permission.collection]!, ...permission.fields]);
				}

				return acc;
			}, {} as { [collection: string]: string[] }) ?? {};

	for (const [collectionName, collection] of Object.entries(schema.collections)) {
		if (
			!permissions?.some(
				(permission) => permission.collection === collectionName && actions.includes(permission.action)
			)
		) {
			continue;
		}

		const fields: SchemaOverview['collections'][string]['fields'] = {};

		for (const [fieldName, field] of Object.entries(schema.collections[collectionName]!.fields)) {
			if (
				!allowedFieldsInCollection[collectionName]?.includes('*') &&
				!allowedFieldsInCollection[collectionName]?.includes(fieldName)
			) {
				continue;
			}

			const o2mRelation = schema.relations.find(
				(relation) => relation.related_collection === collectionName && relation.meta?.one_field === fieldName
			);

			if (
				o2mRelation &&
				!permissions?.some(
					(permission) => permission.collection === o2mRelation.collection && actions.includes(permission.action)
				)
			) {
				continue;
			}

			fields[fieldName] = field;
		}

		reduced.collections[collectionName] = {
			...collection,
			fields,
		};
	}

	reduced.relations = schema.relations.filter((relation) => {
		let collectionsAllowed = true;
		let fieldsAllowed = true;

		if (Object.keys(allowedFieldsInCollection).includes(relation.collection) === false) {
			collectionsAllowed = false;
		}

		if (
			relation.related_collection &&
			(Object.keys(allowedFieldsInCollection).includes(relation.related_collection) === false ||
				// Ignore legacy permissions with an empty fields array
				allowedFieldsInCollection[relation.related_collection]?.length === 0)
		) {
			collectionsAllowed = false;
		}

		if (
			relation.meta?.one_allowed_collections &&
			relation.meta.one_allowed_collections.every((collection) =>
				Object.keys(allowedFieldsInCollection).includes(collection)
			) === false
		) {
			collectionsAllowed = false;
		}

		if (
			!allowedFieldsInCollection[relation.collection] ||
			(allowedFieldsInCollection[relation.collection]?.includes('*') === false &&
				allowedFieldsInCollection[relation.collection]?.includes(relation.field) === false)
		) {
			fieldsAllowed = false;
		}

		if (
			relation.related_collection &&
			relation.meta?.one_field &&
			(!allowedFieldsInCollection[relation.related_collection] ||
				(allowedFieldsInCollection[relation.related_collection]?.includes('*') === false &&
					allowedFieldsInCollection[relation.related_collection]?.includes(relation.meta?.one_field) === false))
		) {
			fieldsAllowed = false;
		}

		return collectionsAllowed && fieldsAllowed;
	});

	return reduced;
}
