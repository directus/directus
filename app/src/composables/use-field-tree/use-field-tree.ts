import { useCollectionsStore, useFieldsStore, useRelationsStore } from '@/stores/';
import { Field, Relation } from '@/types';
import { getRelationType } from '@/utils/get-relation-type';
import { cloneDeep, orderBy } from 'lodash';
import { computed, Ref, ComputedRef } from 'vue';

type FieldOption = { name: string; field: string; key: string; children?: FieldOption[]; group?: string };

export default function useFieldTree(
	collection: Ref<string | null>,
	/** Only allow m2o relations to be nested */
	strict = false,
	inject?: Ref<{ fields: Field[]; relations: Relation[] } | null>,
	filter: (field: Field) => boolean = () => true,
	depth = 3
): { tree: ComputedRef<FieldOption[]> } {
	const fieldsStore = useFieldsStore();
	const collectionsStore = useCollectionsStore();
	const relationsStore = useRelationsStore();

	const tree = computed(() => {
		if (!collection.value) return [];
		return parseLevel(collection.value, null);
	});

	return { tree };

	function parseLevel(collection: string, parentPath: string | null, level = 0) {
		const fieldsInLevel = orderBy(
			[
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
					sort: field.meta?.sort,
				})) as FieldOption[],
			'sort'
		);

		if (level >= depth) return fieldsInLevel;

		for (const field of fieldsInLevel) {
			const relations = [
				...relationsStore.getRelationsForField(collection, field.field),
				...(inject?.value?.relations.filter((relation: Relation) => {
					return (
						(relation.collection === collection && relation.field === field.field) ||
						(relation.related_collection === collection && relation.meta?.one_field === field.field)
					);
				}) || []),
			];

			const relation = relations.find(
				(relation: Relation) =>
					(relation.collection === collection && relation.field === field.field) ||
					(relation.related_collection === collection && relation.meta?.one_field === field.field)
			);

			if (!relation) continue;

			const relationType = getRelationType({ relation, collection, field: field.field });

			if (relationType === 'm2o') {
				field.children = parseLevel(
					relation.related_collection!,
					parentPath ? `${parentPath}.${field.field}` : field.field,
					level + 1
				);
			} else if (relationType === 'm2a') {
				field.children = [];

				for (const relatedCollection of relation.meta!.one_allowed_collections!) {
					const relatedCollectionName =
						collectionsStore.collections.find((collection) => collection.collection === relatedCollection)?.name ||
						relatedCollection;

					field.children.push(
						...parseLevel(
							relatedCollection,
							parentPath ? `${parentPath}.${field.field}:${relatedCollection}` : `${field.field}:${relatedCollection}`,
							level + 1
						).map((child) => ({
							...child,
							name: `${child.name} (${relatedCollectionName})`,
						}))
					);
				}
			} else if (strict === false) {
				field.children = parseLevel(
					relation.collection,
					parentPath ? `${parentPath}.${field.field}` : field.field,
					level + 1
				);
			}
		}

		return fieldsInLevel;
	}
}
