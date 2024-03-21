import { useCollectionsStore } from '@/stores/collections';

export function collectionExists(collection: string) {
	return !!useCollectionsStore().getCollection(collection);
}
