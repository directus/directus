import { computed, ComputedRef } from 'vue';
import { useCollectionsStore, useRelationsStore } from '@/stores/';
import { Relation } from '@directus/shared/types';
import { useCollection } from '@directus/shared/composables';

export type RelationInfo = {
	collection: string;
	collectionField: string;
	junctionCollection: string;
	junctionField: string;
	junctionPkField: string;
	junctionDisplayTemplate: string;
	relatedCollections: string[];
	relatedField: string;
	relationCollection: string;
	relationPkField: string;
	relationDisplayTemplate: string;
	sortField: string;
	type: 'm2o' | 'o2m' | 'm2m' | 'm2a';
};

type In = {
	collection: string;
	field: string;
};

type Out = {
	relationInfo: ComputedRef<RelationInfo>;
};

export function useRelationInfo({ collection, field }: In): Out {
	const relationsStore = useRelationsStore();
	const collectionsStore = useCollectionsStore();

	const relations = computed(() => {
		return relationsStore.getRelationsForField(collection, field) as Relation[];
	});

	const junction = computed(() => {
		if (!relations.value?.length) return null;

		if (relations.value.length === 1) return relations.value[0];

		return (
			(relations.value.find(
				(relation) => relation.related_collection === collection && relation.meta?.one_field === field
			) as Relation) || null
		);
	});

	const relation = computed(() => {
		if (!relations.value?.length) return null;

		if (relations.value.length === 1) return relations.value[0];

		return (
			(relations.value.find(
				(relation) =>
					relation.collection === junction.value?.collection && relation.field === junction.value?.meta?.junction_field
			) as Relation) || null
		);
	});

	const junctionCollection = computed(() => {
		if (!junction.value) return null;

		return collectionsStore.getCollection(junction.value.collection)!;
	});

	const relatedCollections = computed(() => {
		if (relation.value?.related_collection) return [collectionsStore.getCollection(relation.value.related_collection)];

		if (relation.value?.meta?.one_allowed_collections)
			return relation.value.meta.one_allowed_collections.map((collection) =>
				collectionsStore.getCollection(collection)
			);

		return [];
	});

	const relationCollection = computed(() => relatedCollections.value[0]);

	const { primaryKeyField: junctionPrimaryKeyField = null } = junctionCollection.value
		? useCollection(junctionCollection.value.collection)
		: {};

	const { primaryKeyField: relationPrimaryKeyField = null } = relationCollection.value
		? useCollection(relationCollection.value.collection)
		: {};

	const collectionField = computed(() => relation.value?.meta?.one_collection_field);

	const relatedField = computed(() => junction.value?.meta?.junction_field || relation?.value?.meta?.one_field);

	const type = computed(() => {
		if (!relation.value) return null;

		if (relation.value.meta?.junction_field) {
			if (relation.value.meta?.one_allowed_collections) return 'm2a';
			else return 'm2m';
		}

		if (relation.value?.meta?.one_collection === collection) {
			if (relation.value?.meta?.one_field === field) return 'o2m';
			if (relation.value?.meta?.many_field === field) return 'm2o';
		}

		return null;
	});

	const relationInfo = computed(() => {
		return {
			collection,
			collectionField: collectionField.value,
			junctionCollection: junctionCollection.value?.collection,
			junctionField: junction.value?.field,
			junctionPkField: junctionPrimaryKeyField?.value?.field,
			junctionDisplayTemplate: junctionCollection?.value?.meta?.display_template,
			relatedCollections: relatedCollections.value.map((collection) => collection?.collection),
			relatedField: relatedField.value,
			relationCollection: relationCollection.value!.collection,
			relationPkField: relationPrimaryKeyField?.value?.field,
			relationDisplayTemplate: relationCollection?.value?.meta?.display_template,
			sortField: junction.value?.meta?.sort_field as string,
			type: type.value,
		} as RelationInfo;
	});

	return { relationInfo };
}
