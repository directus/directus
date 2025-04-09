import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { getRelatedCollection } from '@/utils/get-related-collection';

type QueryFields = { [key: string]: any };

export function getGraphqlQueryFields(fields: string[], collection: string): QueryFields {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	const graphqlFields =
		fields.length > 0
			? fields
			: fieldsStore
					.getFieldsForCollection(collection)
					.filter((field) => !field.meta?.special?.includes('no-data'))
					.map((field) => field.field);

	const queryFields: QueryFields = {};

	for (const field of graphqlFields) {
		const fieldParts = field.split('.') as [string, ...string[]];

		let currentCollection = collection;
		let currentField = fieldParts[0];
		let currentPath = queryFields;

		while (fieldParts.length > 1) {
			const manyToAny = adjustForManyToAny(currentField, currentCollection, currentPath);

			if (manyToAny) {
				currentCollection = manyToAny.relatedCollection;
				currentPath = manyToAny.currentPath;
			} else {
				const relatedCollection = getRelatedCollection(currentCollection, currentField);
				currentCollection = relatedCollection!.junctionCollection ?? relatedCollection!.relatedCollection;
				currentPath = currentPath[currentField] ??= {};
			}

			fieldParts.shift();
			currentField = fieldParts[0];
		}

		const manyToAny = adjustForManyToAny(currentField, currentCollection, currentPath);

		let relatedCollection;

		if (manyToAny) {
			relatedCollection = manyToAny.relatedCollection;
			currentPath = manyToAny.currentPath;
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
			} else {
				currentPath[currentField] = { [primaryKeyField]: true };
			}
		} else {
			currentPath[currentField] = true;
		}
	}

	return queryFields;

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
