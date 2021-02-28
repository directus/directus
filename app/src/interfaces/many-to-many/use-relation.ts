import { Ref, computed } from '@vue/composition-api';
import { useCollectionsStore, useRelationsStore } from '@/stores/';
import useCollection from '@/composables/use-collection';
import { Relation } from '@/types';

export type RelationInfo = {
	junctionPkField: string;
	relationPkField: string;
	junctionField: string;
	sortField: string;
	junctionCollection: string;
	relationCollection: string;
};

export default function useRelation(collection: Ref<string>, field: Ref<string>) {
	const relationsStore = useRelationsStore();
	const collectionsStore = useCollectionsStore();

	const relations = computed(() => {
		return relationsStore.getRelationsForField(collection.value, field.value) as Relation[];
	});

	const junction = computed(() => {
		return relations.value.find(
			(relation) => relation.one_collection === collection.value && relation.one_field === field.value
		) as Relation;
	});

	const relation = computed(() => {
		return relations.value.find(
			(relation) =>
				relation.many_collection === junction.value.many_collection &&
				relation.many_field !== junction.value.many_field &&
				relation.many_field === junction.value.junction_field
		) as Relation;
	});

	const junctionCollection = computed(() => {
		return collectionsStore.getCollection(junction.value.many_collection)!;
	});

	const relationCollection = computed(() => {
		return collectionsStore.getCollection(relation.value.one_collection)!;
	});

	const { primaryKeyField: junctionPrimaryKeyField } = useCollection(junctionCollection.value.collection);
	const { primaryKeyField: relationPrimaryKeyField } = useCollection(relationCollection.value.collection);

	const relationInfo = computed(() => {
		return {
			junctionPkField: junctionPrimaryKeyField.value.field,
			relationPkField: relationPrimaryKeyField.value.field,
			junctionField: junction.value.junction_field as string,
			sortField: junction.value.sort_field as string,
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
