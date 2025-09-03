import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { LocalType, Relation } from '@directus/types';
import { getRelation } from '@directus/utils';

export function getLocalTypeForField(collection: string, field: string): LocalType | null {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	const fieldInfo = fieldsStore.getField(collection, field);
	const relations: Relation[] = relationsStore.getRelationsForField(collection, field);

	if (!fieldInfo) return null;

	if (relations.length === 0) {
		if (fieldInfo.type === 'alias') {
			if (fieldInfo.meta?.special?.includes('group')) {
				return 'group';
			}

			return 'presentation';
		}

		return 'standard';
	}

	if (relations.length === 1) {
		const relation = relations[0]!;
		if (relation.related_collection === 'directus_files' && relation.related_collection !== collection) return 'file';
		if (relation.collection === collection && relation.field === field) return 'm2o';
		return 'o2m';
	}

	if (relations.length === 2) {
		if ((fieldInfo.meta?.special || []).includes('translations')) {
			return 'translations';
		}

		if ((fieldInfo.meta?.special || []).includes('m2a')) {
			return 'm2a';
		}

		const relationForCurrent = getRelation(relations, collection, field);

		if (relationForCurrent?.collection === collection && relationForCurrent?.field === field) {
			return 'm2o';
		}

		const directusFilesRelationsCount = relations.filter(
			(relation) => relation.related_collection === 'directus_files',
		).length;

		const isRelationToDirectusFiles = collection !== 'directus_files' && directusFilesRelationsCount === 1;
		const isSelfRelationToDirectusFiles = directusFilesRelationsCount === 2;

		if (isRelationToDirectusFiles || isSelfRelationToDirectusFiles) {
			return 'files';
		} else {
			return 'm2m';
		}
	}

	return 'standard';
}
