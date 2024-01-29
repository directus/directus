import { useCollectionsStore } from '@/stores/collections';

export function isSystemCollection(collection: string) {
	return !!useCollectionsStore().systemCollections.includes(collection);
}
