import { uniq } from 'lodash-es';

import type { CollectionOverview, FieldOverview, Permission, PermissionsAction, Relation, SchemaOverview } from '@directus/shared/types';

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

	async function getCollections() {
		const result = await schema.getCollections()

		return Object.entries(result).reduce((acc, [collectionName, collection]) => {
			if (showCollection(collection)) acc[collectionName] = collection;
			return acc
		}, {} as Record<string, CollectionOverview>);
	}
	async function getCollection(collection: string) {
		const result = await schema.getCollection(collection)

		if (result === null || !showCollection(result)) return null;

		return result;
	}
	async function getFields(collection: string) {
		const result = await schema.getFields(collection)

		const relations = await getRelations()

		return Object.entries(result).reduce((acc, [fieldName, field]) => {
			if (showField(collection, field, relations)) acc[fieldName] = field;
			return acc
		}, {} as Record<string, FieldOverview>);
	}
	async function getField(collection: string, field: string) {
		const result = await schema.getField(collection, field)

		const relations = await getRelations()

		if (result === null || !showField(collection, result, relations)) return null;

		return result;
	}
	async function getRelations() {
		return (await schema.getRelations()).filter(relation => showRelation(relation));

	}
	async function getRelationsForCollection(collection: string) {
		const result = await schema.getRelationsForCollection(collection)

		return Object.entries(result).reduce((acc, [key, relation]) => {
			if (showRelation(relation)) acc[key] = relation;
			return acc
		}, {} as Record<string, Relation>);
	}
	async function getRelationsForField(collection: string, field: string) {
		const result = await schema.getRelationsForField(collection, field)

		if (result === null || !showRelation(result)) return null;

		return result;
	}
	async function getPrimaryKeyField(collection: string) {
		const result = await schema.getPrimaryKeyField(collection)

		const relations = await getRelations()

		if (result === null || !showField(collection, result, relations)) return null;

		return result;
	}

	async function hasCollection(collection: string) {
		const result = await schema.hasCollection(collection)

		const collectionInfo = await getCollection(collection)

		if (collectionInfo === null || !showCollection(collectionInfo)) return false;

		return result;
	}

	async function hasField(collection: string, field: string) {
		const result = await schema.hasField(collection, field)

		const fieldInfo = await getField(collection, field)
		const relations = await getRelations()

		if (fieldInfo === null || !showField(collection, fieldInfo, relations)) return false;

		return result;
	}

	const allowedFieldsInCollection = permissions
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

	function showCollection(collection: CollectionOverview) {
		return permissions?.some(
			(permission) => permission.collection === collection.collection && actions.includes(permission.action)
		)
	}

	function showRelation(relation: Relation) {
		let collectionsAllowed = true;
		let fieldsAllowed = true;

		if (Object.keys(allowedFieldsInCollection).includes(relation.collection) === false) {
			collectionsAllowed = false;
		}

		if (
			relation.related_collection &&
			Object.keys(allowedFieldsInCollection).includes(relation.related_collection) === false
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
			(allowedFieldsInCollection[relation.collection]!.includes('*') === false &&
				allowedFieldsInCollection[relation.collection]!.includes(relation.field) === false)
		) {
			fieldsAllowed = false;
		}

		if (
			relation.related_collection &&
			relation.meta?.one_field &&
			(!allowedFieldsInCollection[relation.related_collection] ||
				(allowedFieldsInCollection[relation.related_collection]!.includes('*') === false &&
					allowedFieldsInCollection[relation.related_collection]!.includes(relation.meta?.one_field) === false))
		) {
			fieldsAllowed = false;
		}

		return !collectionsAllowed || !fieldsAllowed;
	}

	function showField(collection: string, field: FieldOverview, relations: Relation[]) {
		if (
			!permissions?.some(
				(permission) => permission.collection === collection && actions.includes(permission.action)
			)
		) return false;

		if (
			!allowedFieldsInCollection[collection]?.includes('*') &&
			!allowedFieldsInCollection[collection]?.includes(field.field)
		) return false;

		const o2mRelation = relations.find(
			(relation) => relation.related_collection === collection && relation.meta?.one_field === field.field
		);

		if (
			o2mRelation &&
			!permissions?.some(
				(permission) => permission.collection === o2mRelation.collection && actions.includes(permission.action)
			)
		) return false

		return true
	}

	return {
		getCollections,
		getCollection,
		getFields,
		getField,
		getRelations,
		getRelationsForCollection,
		getRelationsForField,
		getPrimaryKeyField,
		hasCollection,
		hasField
	}
}
