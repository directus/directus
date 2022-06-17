import { useCollectionsStore, useFieldsStore, useRelationsStore } from '@/stores';
import { Field, Relation } from '@directus/shared/types';
import { Collection } from '@/types';
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

		if (relations.length !== 1) return undefined;

		const relation = relations[0];

		return {
			relation: relation,
			relatedCollection: collectionsStore.getCollection(relation.related_collection as string),
			relatedPrimaryKeyField: fieldsStore.getPrimaryKeyFieldForCollection(relation.related_collection as string),
			type: 'm2o',
		} as RelationM2O;
	});

	return { relationInfo };
}
