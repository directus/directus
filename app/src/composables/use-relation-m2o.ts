import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { Collection } from '@/types/collections';
import { Field, Relation } from '@directus/types';
import { computed, Ref } from 'vue';

export type RelationM2O = {
	relation: Relation;
	relatedCollection: Collection;
	relatedPrimaryKeyField: Field;
	type: 'm2o';
};

/*
One                  Many: relatedCollection
┌──────────┐         ┌───────────────────┐
│id        │    ┌────┤id: relatedPKField │
│many_id   │◄───┘    │                   │
└──────────┘         └───────────────────┘
 */

export function useRelationM2O(collection: Ref<string>, field: Ref<string>) {
	const relationsStore = useRelationsStore();
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();

	const relationInfo = computed<RelationM2O | undefined>(() => {
		const relations = relationsStore.getRelationsForField(collection.value, field.value);

		if (relations.length === 0) return undefined;

		const relation = relations[0] as Relation;

		return {
			relation,
			relatedCollection: collectionsStore.getCollection(relation.related_collection),
			relatedPrimaryKeyField: fieldsStore.getPrimaryKeyFieldForCollection(relation.related_collection),
			type: 'm2o',
		} as RelationM2O;
	});

	return { relationInfo };
}
