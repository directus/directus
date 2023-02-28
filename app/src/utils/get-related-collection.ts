import { useRelationsStore } from '@/stores/relations';
import { Relation } from '@directus/shared/types';
import { getLocalTypeForField } from './get-local-type';

export interface RelatedCollectionData {
	relatedCollection: string | string[];
	junctionCollection?: string;
	path?: string;
	collectionField?: string;
}

/**
 * Get the related collection for a given relational field
 * For many-to-many type fields, it will return both the junction as the related collection
 *
 * @param collection - Name of the current parent collection
 * @param field - Name of the relational field in the current collection
 * @returns Related collection name(s) or null if no related collection exists in the relationsStore
 */
export function getRelatedCollection(collection: string, field: string): RelatedCollectionData | null {
	const relationsStore = useRelationsStore();

	const relations: Relation[] = relationsStore.getRelationsForField(collection, field);

	if (relations.length === 0) return null;

	// const localType = getLocalTypeForField(collection, field);

	/* If only one relation is returned, it must be an o2m or m2o
	 * so no junction table and we just
	 * return whichever collection isn't the current one
	 */
	if (relations.length === 1) {
		return {
			relatedCollection:
				relations[0].collection === collection ? relations[0].related_collection! : relations[0].collection,
		};
		/* Else it must be a junction collection, either m2m or m2a
		 * (translations is also an m2m)
		 */
	} else if (relations.length === 2) {
		const secondaryRelation = relations.find((relation) => relation.meta?.one_collection !== collection);
		if (
			!secondaryRelation ||
			relations[0].collection !== relations[1].collection ||
			(secondaryRelation.meta?.one_collection == null && secondaryRelation.meta?.one_allowed_collections == null)
		) {
			return null;
		}
		const result: RelatedCollectionData = {
			relatedCollection: secondaryRelation.meta?.one_collection ?? secondaryRelation.meta.one_allowed_collections!,
			junctionCollection: relations[0].collection,
			path: secondaryRelation.field,
		};
		if (secondaryRelation.meta.one_collection_field) {
			result.collectionField = secondaryRelation.meta.one_collection_field;
		}
		return result;
	}
	return null;
}
