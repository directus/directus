import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { getRelatedCollection } from '@/utils/get-related-collection';

type QueryFields = { [key: string]: any };

/**
 * Alias mapping structure: maps collection names to field aliases
 * e.g., { 'child1': { 'child1__items': 'items' }, 'child2': { 'child2__items': 'items' } }
 */
export type M2AAliasMap = Record<string, Record<string, string>>;

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

		while (fieldParts.length > 1) {
			const manyToAny = adjustForManyToAny(currentField, currentCollection, currentPath);

			if (manyToAny) {
				currentCollection = manyToAny.relatedCollection;
				currentPath = manyToAny.currentPath;
				inM2AFragment = manyToAny.relatedCollection;
			} else {
				const relatedCollection = getRelatedCollection(currentCollection, currentField);
				currentCollection = relatedCollection!.junctionCollection ?? relatedCollection!.relatedCollection;

				if (inM2AFragment) {
					// Inside M2A fragment - use aliased field name
					const aliasedField = `${inM2AFragment}__${currentField}`;
					m2aAliasMap[inM2AFragment] ??= {};
					m2aAliasMap[inM2AFragment][aliasedField] = currentField;

					currentPath = currentPath[aliasedField] ??= { __aliasFor: currentField };
				} else {
					currentPath = currentPath[currentField] ??= {};
				}
			}

			fieldParts.shift();
			currentField = fieldParts[0];
		}

		const manyToAny = adjustForManyToAny(currentField, currentCollection, currentPath);

		let relatedCollection;

		if (manyToAny) {
			relatedCollection = manyToAny.relatedCollection;
			currentPath = manyToAny.currentPath;
			inM2AFragment = manyToAny.relatedCollection;
		} else {
			const maybeRelatedCollection = getRelatedCollection(currentCollection, currentField);

			if (maybeRelatedCollection) {
				relatedCollection = maybeRelatedCollection.junctionCollection ?? maybeRelatedCollection.relatedCollection;
			}
		}

		if (relatedCollection) {
			const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection)!.field;

			if (manyToAny) {
				currentPath[primaryKeyField] = true;
			} else if (inM2AFragment) {
				// Inside M2A fragment - use aliased field name for relations
				const aliasedField = `${inM2AFragment}__${currentField}`;
				m2aAliasMap[inM2AFragment] ??= {};
				m2aAliasMap[inM2AFragment][aliasedField] = currentField;

				currentPath[aliasedField] = { __aliasFor: currentField, [primaryKeyField]: true };
			} else {
				currentPath[currentField] = { [primaryKeyField]: true };
			}
		} else {
			if (inM2AFragment) {
				// Inside M2A fragment - use aliased field name for scalar fields
				const aliasedField = `${inM2AFragment}__${currentField}`;
				m2aAliasMap[inM2AFragment] ??= {};
				m2aAliasMap[inM2AFragment][aliasedField] = currentField;

				currentPath[aliasedField] = { __aliasFor: currentField };
			} else {
				currentPath[currentField] = true;
			}
		}
	}

	return { queryFields, m2aAliasMap };

	function adjustForManyToAny(field: string, currentCollection: string, currentPath: QueryFields) {
		const isManyToAny = field.includes(':');
		if (!isManyToAny) return;

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

		return { relatedCollection, currentPath };
	}
}
