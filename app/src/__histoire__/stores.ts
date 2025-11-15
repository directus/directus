import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { STORES_INJECT } from '@directus/constants';
import { provide } from 'vue';
import { collections, fields, relations } from './store-values';
import { useRelationsStore } from '@/stores/relations';

export function loadStores() {
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	collectionsStore.collections = collections;
	fieldsStore.fields = fields;
	relationsStore.relations = relations;

	provide(STORES_INJECT, {
		useCollectionsStore,
		useFieldsStore,
		useRelationsStore,
	});
}
