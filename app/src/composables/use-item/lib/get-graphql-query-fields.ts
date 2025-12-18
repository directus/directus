import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { getRelatedCollection } from '@/utils/get-related-collection';

type QueryFields = { [key: string]: any };

/**
 * Alias mapping structure: scoped by full field path to support multiple M2A relations
 * that may target the same child collections.
 *
 * Structure:
 * {
 *   "items.item": {
 *     "collectionField": "collection_ref",  // The actual field name in junction table
 *     "junctionField": "item",              // The junction M2O field name (can be renamed, e.g., "value")
 *     "aliases": {
 *       "child1": { "child1__items": "items" },
 *       "child2": { "child2__items": "items" }
 *     }
 *   },
 *   "items2.value": {
 *     "collectionField": "collection",
 *     "junctionField": "value",             // Custom junction field name
 *     "aliases": {
 *       "child1": { "child1__items": "items" },
 *       "child2": { "child2__items": "items" }
 *     }
 *   }
 * }
 */
export type M2AAliasMap = Record<
	string,
	{
		collectionField: string;
		junctionField: string;
		aliases: Record<string, Record<string, string>>;
	}
>;

export interface GraphqlQueryFieldsResult {
	queryFields: QueryFields;
	m2aAliasMap: M2AAliasMap;
}

export function getGraphqlQueryFields(fields: string[], collection: string): GraphqlQueryFieldsResult {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	const graphqlFields =
		fields.length > 0
			? fields
			: fieldsStore
					.getFieldsForCollection(collection)
					.filter((field) => !field.meta?.special?.includes('no-data') && field.field.startsWith('$') === false)
					.map((field) => field.field);

	const queryFields: QueryFields = {};
	const m2aAliasMap: M2AAliasMap = {};

	for (const field of graphqlFields) {
		const fieldParts = field.split('.') as [string, ...string[]];

		let currentCollection = collection;
		let currentField = fieldParts[0];
		let currentPath = queryFields;
		let inM2AFragment: string | null = null;
		const m2aFieldPath: string[] = []; // Track full path to M2A junction (e.g., ["items", "item"])
		let m2aCollectionField: string | null = null; // Track collection field name for this M2A relation
		let m2aJunctionField: string | null = null; // Track junction field name (e.g., "item" or "value")

		while (fieldParts.length > 1) {
			const m2a = adjustForM2A(currentField, currentCollection, currentPath);

			if (m2a) {
				currentCollection = m2a.relatedCollection;
				currentPath = m2a.currentPath;
				inM2AFragment = m2a.relatedCollection;
				// Extract the field name before the ":" (e.g., "item" from "item:child1" or "value" from "value:child1")
				const fieldName = currentField.split(':')[0]!;
				m2aFieldPath.push(fieldName);
				m2aCollectionField = m2a.collectionField;
				m2aJunctionField = fieldName; // Store the junction field name
			} else {
				const relatedCollection = getRelatedCollection(currentCollection, currentField);
				currentCollection = relatedCollection!.junctionCollection ?? relatedCollection!.relatedCollection;

				// Build up the field path as we traverse
				if (!inM2AFragment) {
					m2aFieldPath.push(currentField);
				}

				if (inM2AFragment && m2aFieldPath.length > 0) {
					// Inside M2A fragment - use aliased field name
					const aliasedField = `${inM2AFragment}__${currentField}`;
					const fieldPathKey = m2aFieldPath.join('.');

					// Ensure the alias map entry exists for this field path
					if (!m2aAliasMap[fieldPathKey]) {
						m2aAliasMap[fieldPathKey] = {
							collectionField: m2aCollectionField!,
							junctionField: m2aJunctionField!,
							aliases: {},
						};
					}

					m2aAliasMap[fieldPathKey]!.aliases[inM2AFragment] ??= {};
					m2aAliasMap[fieldPathKey]!.aliases[inM2AFragment]![aliasedField] = currentField;

					currentPath = currentPath[aliasedField] ??= { __aliasFor: currentField };
				} else {
					currentPath = currentPath[currentField] ??= {};
				}
			}

			fieldParts.shift();
			currentField = fieldParts[0];
		}

		const m2a = adjustForM2A(currentField, currentCollection, currentPath);

		let relatedCollection;

		if (m2a) {
			relatedCollection = m2a.relatedCollection;
			currentPath = m2a.currentPath;
			inM2AFragment = m2a.relatedCollection;
			const fieldName = currentField.split(':')[0]!;
			m2aFieldPath.push(fieldName);
			m2aCollectionField = m2a.collectionField;
			m2aJunctionField = fieldName; // Store the junction field name
		} else {
			const maybeRelatedCollection = getRelatedCollection(currentCollection, currentField);

			if (maybeRelatedCollection) {
				relatedCollection = maybeRelatedCollection.junctionCollection ?? maybeRelatedCollection.relatedCollection;
			}
		}

		if (relatedCollection) {
			const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection)!.field;

			if (m2a) {
				currentPath[primaryKeyField] = true;
			} else if (inM2AFragment && m2aFieldPath.length > 0) {
				// Inside M2A fragment - use aliased field name for relations
				const aliasedField = `${inM2AFragment}__${currentField}`;
				const fieldPathKey = m2aFieldPath.join('.');

				if (!m2aAliasMap[fieldPathKey]) {
					m2aAliasMap[fieldPathKey] = {
						collectionField: m2aCollectionField!,
						junctionField: m2aJunctionField!,
						aliases: {},
					};
				}

				m2aAliasMap[fieldPathKey]!.aliases[inM2AFragment] ??= {};
				m2aAliasMap[fieldPathKey]!.aliases[inM2AFragment]![aliasedField] = currentField;

				currentPath[aliasedField] = { __aliasFor: currentField, [primaryKeyField]: true };
			} else {
				currentPath[currentField] = { [primaryKeyField]: true };
			}
		} else {
			if (inM2AFragment && m2aFieldPath.length > 0) {
				// Inside M2A fragment - use aliased field name for scalar fields
				const aliasedField = `${inM2AFragment}__${currentField}`;
				const fieldPathKey = m2aFieldPath.join('.');

				if (!m2aAliasMap[fieldPathKey]) {
					m2aAliasMap[fieldPathKey] = {
						collectionField: m2aCollectionField!,
						junctionField: m2aJunctionField!,
						aliases: {},
					};
				}

				m2aAliasMap[fieldPathKey]!.aliases[inM2AFragment] ??= {};
				m2aAliasMap[fieldPathKey]!.aliases[inM2AFragment]![aliasedField] = currentField;

				currentPath[aliasedField] = { __aliasFor: currentField };
			} else {
				currentPath[currentField] = true;
			}
		}
	}

	return { queryFields, m2aAliasMap };

	function adjustForM2A(field: string, currentCollection: string, currentPath: QueryFields) {
		const isM2A = field.includes(':');
		if (!isM2A) return;

		const [sourceField, relatedCollection] = field.split(':') as [string, string];

		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(currentCollection)!.field;
		currentPath[primaryKeyField] = true;

		const relation = relationsStore.getRelationForField(currentCollection, sourceField);
		const collectionField = relation!.meta!.one_collection_field!;

		const args = (currentPath.__args ??= { filter: { [collectionField]: { _in: [] } } });

		if (!args.filter[collectionField]._in.includes(relatedCollection))
			args.filter[collectionField]._in.push(relatedCollection);

		const itemPath = (currentPath[sourceField] ??= {});
		const fragments = (itemPath.__on ??= []) as QueryFields[];
		const existingFragment = fragments.find((fragment) => fragment.__typeName === relatedCollection);

		if (existingFragment) {
			currentPath = existingFragment;
		} else {
			const fragment = {
				__typeName: relatedCollection,
			};

			fragments.push(fragment);

			currentPath = fragment;
		}

		return { relatedCollection, currentPath, collectionField };
	}
}
