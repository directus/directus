import { useFieldsStore } from '@/stores/fields';
import { getRelatedCollection } from '@/utils/get-related-collection';

type QueryFields = { [key: string]: boolean | QueryFields };

export function getGraphqlQueryFields(fields: string[], collection: string): QueryFields {
	const fieldsStore = useFieldsStore();

	const graphqlFields =
		fields.length > 0 ? fields : fieldsStore.getFieldsForCollection(collection).map((field) => field.field);

	const queryFields: QueryFields = {};

	for (const field of graphqlFields) {
		const fieldParts = field.split('.');

		let currentCollection = collection;
		let currentField = fieldParts[0]!;
		let currentPath = queryFields;

		while (fieldParts.length > 1) {
			const relatedCollection = getRelatedCollection(currentCollection, currentField);
			currentCollection = relatedCollection!.junctionCollection ?? relatedCollection!.relatedCollection;
			currentPath = (currentPath[currentField] as QueryFields | undefined) ??= {};
			fieldParts.shift();
			currentField = fieldParts[0]!;
		}

		const relatedCollection = getRelatedCollection(currentCollection, currentField);

		if (relatedCollection) {
			const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(
				relatedCollection.junctionCollection ?? relatedCollection.relatedCollection,
			);

			if (primaryKeyField) {
				currentPath[currentField] = { [primaryKeyField.field]: true };
			}
		} else {
			currentPath[currentField] = true;
		}
	}

	return queryFields;
}
