import { useCollectionsStore } from '@/stores/collections';

export let hydrated = false;

export async function hydrate() {
	if (hydrated) return;
	await useCollectionsStore().getCollections();
	hydrated = true;
}

export async function dehydrate() {
	if (hydrated === false) return;
	useCollectionsStore().reset();
	hydrated = false;
}
