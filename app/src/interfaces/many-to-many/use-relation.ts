import { Ref, computed } from '@vue/composition-api';
import useCollection from '@/composables/use-collection';
import { Relation } from '@/types/';
import { useRelationsStore } from '@/stores/';

type RelationParams = {
	collection: Ref<string>;
	field: Ref<string>;
};

export default function useRelation({ collection, field }: RelationParams) {
	const relationsStore = useRelationsStore();

	// We expect two relations to exist for this field: one from this field to the junction
	// table, and one from the junction table to the related collection
	const relations = computed<Relation[]>(() => {
		return relationsStore.getRelationsForField(collection.value, field.value);
	});

	const relationCurrentToJunction = computed(() => {
		return relations.value.find(
			(relation: Relation) => relation.one_collection === collection.value && relation.one_field === field.value
		);
	});

	const relationJunctionToRelated = computed(() => {
		if (!relationCurrentToJunction.value) return null;

		const index = relations.value.indexOf(relationCurrentToJunction.value) === 1 ? 0 : 1;
		return relations.value[index];
	});

	const junctionCollection = computed(() => relations.value[0].many_collection);
	const relatedCollection = computed(() => relations.value[1].one_collection);

	const { primaryKeyField: junctionCollectionPrimaryKeyField } = useCollection(junctionCollection);
	const { primaryKeyField: relatedCollectionPrimaryKeyField } = useCollection(relatedCollection);

	return {
		relations,
		relationCurrentToJunction,
		relationJunctionToRelated,
		junctionCollection,
		junctionCollectionPrimaryKeyField,
		relatedCollection,
		relatedCollectionPrimaryKeyField,
	};
}
