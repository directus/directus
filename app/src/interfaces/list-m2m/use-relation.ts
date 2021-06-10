import useCollection from '@/composables/use-collection';
import { useCollectionsStore, useRelationsStore } from '@/stores/';
import { Collection, Field, Relation } from '@/types';
import { computed, ComputedRef, Ref } from 'vue';

export type RelationInfo = {
	junctionPkField: string;
	relationPkField: string;
	junctionField: string;
	sortField: string;
	junctionCollection: string;
	relationCollection: string;
};

type UsableRelation = {
	junction: ComputedRef<Relation>;
	junctionCollection: ComputedRef<Collection>;
	relation: ComputedRef<Relation>;
	relationCollection: ComputedRef<Collection>;
	relationInfo: ComputedRef<RelationInfo>;
	junctionPrimaryKeyField: ComputedRef<Field | null>;
	relationPrimaryKeyField: ComputedRef<Field | null>;
};

export default function useRelation(collection: Ref<string>, field: Ref<string>): UsableRelation {
	const relationsStore = useRelationsStore();
	const collectionsStore = useCollectionsStore();

	const relations = computed(() => {
		return relationsStore.getRelationsForField(collection.value, field.value) as Relation[];
	});

	const junction = computed(() => {
		return relations.value.find(
			(relation) => relation.related_collection === collection.value && relation.meta?.one_field === field.value
		) as Relation;
	});

	const relation = computed(() => {
		return relations.value.find(
			(relation) =>
				relation.collection === junction.value.collection &&
				relation.field !== junction.value.field &&
				relation.field === junction.value.meta?.junction_field
		) as Relation;
	});

	const junctionCollection = computed(() => {
		return collectionsStore.getCollection(junction.value.collection)!;
	});

	const relationCollection = computed(() => {
		return collectionsStore.getCollection(relation.value.related_collection!)!;
	});

	const { primaryKeyField: junctionPrimaryKeyField } = useCollection(junctionCollection.value.collection);
	const { primaryKeyField: relationPrimaryKeyField } = useCollection(relationCollection.value.collection);

	const relationInfo = computed(() => {
		return {
			junctionPkField: junctionPrimaryKeyField.value.field,
			relationPkField: relationPrimaryKeyField.value.field,
			junctionField: junction.value.meta?.junction_field as string,
			sortField: junction.value.meta?.sort_field as string,
			junctionCollection: junctionCollection.value.collection,
			relationCollection: relationCollection.value.collection,
		} as RelationInfo;
	});

	return {
		junction,
		junctionCollection,
		relation,
		relationCollection,
		relationInfo,
		junctionPrimaryKeyField,
		relationPrimaryKeyField,
	};
}
