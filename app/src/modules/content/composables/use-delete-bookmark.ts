import type { Preset } from '@directus/types';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePresetsStore } from '@/stores/presets';
import { getCollectionRoute } from '@/utils/get-route';
import { unexpectedError } from '@/utils/unexpected-error';

export function useDeleteBookmark() {
	const route = useRoute();
	const router = useRouter();
	const presetsStore = usePresetsStore();

	const deleteActive = ref(false);
	const deleteSaving = ref(false);

	return { deleteActive, deleteSaving, deleteSave };

	async function deleteSave(bookmark: Preset) {
		if (deleteSaving.value || !bookmark.id) return;

		deleteSaving.value = true;

		try {
			let navigateTo: string | null = null;

			if (route.query?.bookmark && +route.query.bookmark === bookmark.id) {
				navigateTo = getCollectionRoute(bookmark.collection);
			}

			await presetsStore.delete([bookmark.id]);
			deleteActive.value = false;

			if (navigateTo) router.replace(navigateTo);
		} catch (error) {
			unexpectedError(error);
		} finally {
			deleteSaving.value = false;
		}
	}
}
