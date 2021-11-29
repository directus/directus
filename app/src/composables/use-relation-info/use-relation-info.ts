import { computed, ComputedRef } from 'vue';
import { useRelationsStore } from '@/stores/';
import { Relation } from '@directus/shared/types';
import { UsableCollection, useCollection } from '@directus/shared/composables';

type RelationInfoCollection = {
	collection: string;
	primaryKeyField: string;
	displayTemplate: string;
	sortField: string;
};

export type RelationInfo = {
	collectionField: string;
	collection: string;
	junctionField: string;
	junction: RelationInfoCollection | null;
	relatedField: string;
	related: RelationInfoCollection[];
	relation: RelationInfoCollection | null;
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

		const collection = useCollection(junction.value.collection);

		return {
			collection: collection.collection.value ?? '',
			displayTemplate: collection.displayTemplate.value ?? '',
			primaryKeyField: collection.primaryKeyField.value?.field ?? '',
			sortField: collection.sortField.value ?? '',
		} as RelationInfoCollection;
	});

	const relatedCollections = computed(() => {
		let collections: UsableCollection[] = [];

		if (relation.value?.related_collection) collections = [useCollection(relation.value.related_collection)];

		if (relation.value?.meta?.one_allowed_collections)
			collections = relation.value.meta.one_allowed_collections.map((collection) => useCollection(collection));

		return collections.map((collection) => {
			return {
				collection: collection.collection.value ?? '',
				displayTemplate: collection.displayTemplate.value ?? '',
				primaryKeyField: collection.primaryKeyField.value?.field ?? '',
				sortField: collection.sortField.value ?? '',
			} as RelationInfoCollection;
		});
	});

	const relationCollection = computed(() => relatedCollections.value[0] ?? null);

	const collectionField = computed(() => relation.value?.meta?.one_collection_field);

	const junctionField = computed(() => junction.value?.field);

	const relatedField = computed(() => junction.value?.meta?.junction_field || relation?.value?.meta?.one_field);

	const sortField = computed(() => junction.value?.meta?.sort_field);

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
			collectionField: collectionField.value,
			collection,
			junctionField: junctionField.value,
			junction: junctionCollection.value,
			relatedField: relatedField.value,
			related: relatedCollections.value,
			relation: relationCollection.value,
			sortField: sortField.value,
			type: type.value,
		} as RelationInfo;
	});

	return { relationInfo };
}
