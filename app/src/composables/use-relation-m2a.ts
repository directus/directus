import { isSystemCollection } from '@directus/system-data';
import { Field, Relation } from '@directus/types';
import { computed, Ref } from 'vue';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { Collection } from '@/types/collections';
import { isExcludedCollection } from '@/utils/is-excluded-collection';

export type RelationM2A = {
	allowedCollections: Collection[];
	relationPrimaryKeyFields: Record<string, Field>;
	collectionField: Field;
	junctionCollection: Collection;
	junctionPrimaryKeyField: Field;
	junctionField: Field;
	reverseJunctionField: Field;
	junction: Relation;
	relation: Relation;
	sortField?: string;
	type: 'm2a';
};

/*
One1              Many|Any: junctionCollection          ┌─One2
┌─────────┐       ┌─────────────────────────────┐       │ ┌─────────┐
│id       ├───┐   │id: junctionPKField          │    ┌──┼─┤id       │
│many     │   └──►│one1_id: reverseJunctionField│    │  │ │         │
└─────────┘       │item: junctionField          │◄───┤  │ └─────────┘
                  │sort: sortField              │    │  │
                  │collection: collectionField  │◄───┼──┤
                  └─────────────────────────────┘    │  │
                                                     │  └─One3
                AllowedCollection: [One2,One3]		 │    ┌─────────┐
                relatedPKFields: {One2: id,One3: id} └────┤id       │
                                                          │         │
                                                          └─────────┘
 */

export function useRelationM2A(collection: Ref<string>, field: Ref<string>) {
	const relationsStore = useRelationsStore();
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();

	const relationInfo = computed<RelationM2A | undefined>(() => {
		const relations = relationsStore.getRelationsForField(collection.value, field.value);

		const junction = relations.find(
			(relation) =>
				relation.related_collection === collection.value &&
				relation.meta?.one_field === field.value &&
				relation.meta.junction_field,
		);

		if (!junction) return undefined;

		const relation = relations.find(
			(relation) => relation.collection === junction.collection && relation.field === junction.meta?.junction_field,
		);

		if (!relation) return undefined;
		const relationPrimaryKeyFields = {} as Record<string, Field>;
		const allowedCollections = [] as Collection[];

		for (const collection of relation.meta?.one_allowed_collections ?? []) {
			const collectionInfo = collectionsStore.getCollection(collection);

			if (
				!collectionInfo ||
				(!isSystemCollection(collectionInfo.collection) &&
					(!collectionInfo.meta || isExcludedCollection(collectionInfo)))
			) {
				return undefined;
			}

			const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(collectionInfo.collection);
			if (!primaryKeyField) return undefined;

			relationPrimaryKeyFields[collectionInfo.collection] = primaryKeyField;
			allowedCollections.push(collectionInfo);
		}

		const collectionField = fieldsStore.getField(junction.collection, relation.meta?.one_collection_field as string);
		const junctionCollection = collectionsStore.getCollection(junction.collection);
		const junctionPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(junction.collection);
		const junctionField = fieldsStore.getField(junction.collection, junction.meta?.junction_field as string);
		const reverseJunctionField = fieldsStore.getField(junction.collection, relation.meta?.junction_field as string);

		if (
			!collectionField ||
			!junctionCollection ||
			!junctionPrimaryKeyField ||
			!junctionField ||
			!reverseJunctionField
		) {
			return undefined;
		}

		return {
			allowedCollections,
			relationPrimaryKeyFields,
			collectionField,
			junctionCollection,
			junctionPrimaryKeyField,
			junctionField,
			reverseJunctionField,
			junction,
			relation,
			sortField: junction.meta?.sort_field ?? undefined,
			type: 'm2a',
		} as RelationM2A;
	});

	return { relationInfo };
}
