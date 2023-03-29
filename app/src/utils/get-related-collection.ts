import { useRelationsStore } from '@/stores/relations';
import { Relation } from '@directus/shared/types';
import { getLocalTypeForField } from './get-local-type';

export interface RelatedCollectionData {
	relatedCollection: string;
	junctionCollection?: string;
	path?: string[];
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

	const localType = getLocalTypeForField(collection, field);

	const o2mTypes = ['o2m', 'm2m', 'm2a', 'translations', 'files'];

	if (localType && o2mTypes.includes(localType)) {
		if (localType == 'm2m' && relations.length > 1) {
			return {
				relatedCollection: relations[1].related_collection!,
				junctionCollection: relations[0].collection,
				path: [relations[1].field],
			};
		}

		return { relatedCollection: relations[0].collection };
	}

	return { relatedCollection: relations[0].related_collection! };
}
