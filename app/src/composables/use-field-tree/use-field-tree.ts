import { Ref, computed, ComputedRef } from '@vue/composition-api';
import { useFieldsStore, useRelationsStore } from '@/stores/';
import { Field, Relation } from '@/types';
import { cloneDeep } from 'lodash';
import { getRelationType } from '@/utils/get-relation-type';

type FieldOption = { name: string; field: string; key: string; children?: FieldOption[] };

export default function useFieldTree(
	collection: Ref<string>,
	/** Only allow m2o relations to be nested */
	strict: boolean = false,
	inject?: Ref<{ fields: Field[]; relations: Relation[] } | null>,
	filter: (field: Field) => boolean = () => true
): Record<string, ComputedRef> {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	const tree = computed(() => parseLevel(collection.value, null));

	return { tree };

	function parseLevel(collection: string, parentPath: string | null, level = 0) {
		const fieldsInLevel = [
			...cloneDeep(fieldsStore.getFieldsForCollectionAlphabetical(collection)),
			...(inject?.value?.fields.filter((field) => field.collection === collection) || []),
		]
			.filter((field: Field) => {
				const shown =
					field.meta?.special?.includes('alias') !== true && field.meta?.special?.includes('no-data') !== true;
				return shown;
			})
			.filter(filter)
			.map((field: Field) => ({
				name: field.name,
				field: field.field,
				key: parentPath ? `${parentPath}.${field.field}` : field.field,
			})) as FieldOption[];

		if (level >= 3) return fieldsInLevel;

		for (const field of fieldsInLevel) {
			const relations = [
				...relationsStore.getRelationsForField(collection, field.field),
				...(inject?.value?.relations.filter((relation: Relation) => {
					return (
						(relation.many_collection === collection && relation.many_field === field.field) ||
						(relation.one_collection === collection && relation.one_field === field.field)
					);
				}) || []),
			];

			const relation = relations.find(
				(relation: Relation) =>
					(relation.many_collection === collection && relation.many_field === field.field) ||
					(relation.one_collection === collection && relation.one_field === field.field)
			);

			if (!relation) continue;

			const relationType = getRelationType({ relation, collection, field: field.field });

			if (relationType === 'm2o') {
				field.children = parseLevel(
					relation.one_collection,
					parentPath ? `${parentPath}.${field.field}` : field.field,
					level + 1
				);
			} else if (strict === false) {
				field.children = parseLevel(
					relation.many_collection,
					parentPath ? `${parentPath}.${field.field}` : field.field,
					level + 1
				);
			}
		}

		return fieldsInLevel;
	}
}
