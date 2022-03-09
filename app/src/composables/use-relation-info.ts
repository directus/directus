import { useCollectionsStore, useFieldsStore, useRelationsStore } from '@/stores';
import { Collection, Field, Relation } from '@directus/shared/types';
import { computed, Ref } from 'vue';

type RelationInfo = {
	relation: Relation;
	relatedCollection: Collection;
	relatedPrimaryKeyField: Field;
};
export type RelationO2M = RelationInfo;
export type RelationM2O = RelationInfo & {
	sortField?: string;
};

export type RelationM2M = RelationO2M & {
	junctionCollection: Collection;
	junctionPrimaryKeyField: Field;
	junctionFields: Field[];
	junction: Relation;
};

export type RelationM2A = {
	allowedCollections: string[];
	collectionField: Field;
	junctionCollection: Collection;
	junctionPrimaryKeyField: Field;
	junctionFields: Field[];
	junction: Relation;
	relation: Relation;
	sortField?: string;
};
/**
 * Used to get relation info for a given field
 * @param collection The current collection
 * @param field The current field
 * @returns information about the relation if there is one
 */
function useRelationInfo(collection: Ref<string>, field: Ref<string>) {
	const relationsStore = useRelationsStore();
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();

	const relations = relationsStore.getRelationsForField(collection.value, field.value);

	const junction = computed(() =>
		relations.find(
			(relation) =>
				relation.related_collection === collection.value &&
				relation.meta?.one_field === field.value &&
				relation.meta.junction_field
		)
	);

	const relation = computed(() => {
		const junctionRelation = junction.value;
		if (junctionRelation === undefined) return relations[0];

		return relations.find(
			(relation) =>
				relation.collection === junctionRelation.collection && relation.field === junctionRelation.meta?.junction_field
		);
	});

	const relationInfo = computed<RelationM2A | RelationM2M | RelationM2O | RelationO2M | undefined>(() => {
		const relationInfo = relation.value;
		if (!relationInfo) return undefined;

		if (junction.value === undefined) {
			if (relation.value?.collection === collection.value) {
				// M2O Relation
				return {
					relation: relationInfo,
					relatedCollection: collectionsStore.getCollection(relationInfo.related_collection as string),
					relatedPrimaryKeyField: fieldsStore.getPrimaryKeyFieldForCollection(
						relationInfo.related_collection as string
					),
					sortField: relationInfo.meta?.sort_field ?? undefined,
				} as RelationM2O;
			} else {
				// O2M Relation
				return {
					relation: relationInfo,
					relatedCollection: collectionsStore.getCollection(relationInfo.collection),
					relatedPrimaryKeyField: fieldsStore.getPrimaryKeyFieldForCollection(relationInfo.collection),
				} as RelationO2M;
			}
		} else {
			const junctionInfo = junction.value;

			if (relationInfo.meta?.one_allowed_collections) {
				// M2A Relation
				return {
					allowedCollections: relationInfo.meta?.one_allowed_collections,
					collectionField: fieldsStore.getField(
						junctionInfo.collection,
						relationInfo.meta.one_collection_field as string
					),
					junctionCollection: collectionsStore.getCollection(junctionInfo.collection),
					junctionPrimaryKeyField: fieldsStore.getPrimaryKeyFieldForCollection(junctionInfo.collection),
					junctionFields: fieldsStore.getFieldsForCollection(junctionInfo.collection),
					junction: junctionInfo,
					relation: relationInfo,
					sortField: relationInfo.meta?.sort_field ?? undefined,
				} as RelationM2A;
			} else {
				// M2M Relation
				return {
					relation: relationInfo,
					relatedCollection: collectionsStore.getCollection(relationInfo.related_collection as string),
					relatedPrimaryKeyField: fieldsStore.getPrimaryKeyFieldForCollection(
						relationInfo.related_collection as string
					),
					sortField: relationInfo.meta?.sort_field ?? undefined,
					junctionCollection: collectionsStore.getCollection(junctionInfo.collection),
					junctionPrimaryKeyField: fieldsStore.getPrimaryKeyFieldForCollection(junctionInfo.collection),
					junctionFields: fieldsStore.getFieldsForCollection(junctionInfo.collection),
					junction: junctionInfo,
				} as RelationM2M;
			}
		}
	});

	return { relationInfo };
}

export { useRelationInfo };
