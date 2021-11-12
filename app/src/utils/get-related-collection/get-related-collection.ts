import { useRelationsStore } from '@/stores/';
import { Relation } from '@directus/shared/types';
import { getLocalTypeForField } from '../../modules/settings/routes/data-model/get-local-type';

export interface RelatedCollectionData {
	relatedCollection: string;
	path?: string[];
}

export default function getRelatedCollection(collection: string, field: string): RelatedCollectionData {
	const relationsStore = useRelationsStore();

	const relations: Relation[] = relationsStore.getRelationsForField(collection, field);
	const localType = getLocalTypeForField(collection, field);

	const o2mTypes = ['o2m', 'm2m', 'm2a', 'translations', 'files'];
	if (localType && o2mTypes.includes(localType)) {
		if (localType == 'm2m' && relations.length > 1) {
			return {
				relatedCollection: relations[1].related_collection!,
				path: [relations[1].field],
			};
		}

		return { relatedCollection: relations[0].collection };
	}

	return { relatedCollection: relations[0].related_collection! };
}
