import { useFieldsStore } from '@/stores/fields';
import { getRelatedCollection } from '@/utils/get-related-collection';

type QueryFields = { [key: string]: string | boolean | QueryFields | QueryFields[] };

export function getGraphqlQueryFields(fields: string[], collection: string): QueryFields {
	const fieldsStore = useFieldsStore();

	const graphqlFields =
		fields.length > 0 ? fields : fieldsStore.getFieldsForCollection(collection).map((field) => field.field);

	const queryFields: QueryFields = {};

	for (const field of graphqlFields) {
		const fieldParts = field.split('.') as [string, ...string[]];

		let currentCollection = collection;
		let currentField = fieldParts[0];
		let currentPath = queryFields;

		while (fieldParts.length > 1) {
			const manyToAny = adjustForManyToAny(currentField, currentPath);

			if (manyToAny) {
				currentCollection = manyToAny.relatedCollection;
				currentPath = manyToAny.currentPath;
			} else {
				const relatedCollection = getRelatedCollection(currentCollection, currentField);
				currentCollection = relatedCollection!.junctionCollection ?? relatedCollection!.relatedCollection;
				currentPath = (currentPath[currentField] as QueryFields | undefined) ??= {};
			}

			fieldParts.shift();
			currentField = fieldParts[0];
		}

		const manyToAny = adjustForManyToAny(currentField, currentPath);

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
}

function adjustForManyToAny(field: string, currentPath: QueryFields) {
	const isManyToAny = field.includes(':');

	if (isManyToAny) {
		const [sourceField, relatedCollection] = field.split(':') as [string, string];

		const manyToAnyPath = ((currentPath[sourceField] as QueryFields | undefined) ??= {});
		const fragments = (manyToAnyPath.__on ??= []) as QueryFields[];

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

		return { sourceField, relatedCollection, currentPath };
	}

	return null;
}
