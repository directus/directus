import api from '@/api';
import type { ApiOutput } from '@directus/extensions';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useExtensionsStore = defineStore('extensions', () => {
	const loading = ref(false);
	const error = ref<unknown>(null);
	const extensions = ref<ApiOutput[]>([]);

	const refresh = async () => {
		loading.value = true;

		try {
			const response = await api.get('/extensions');
			extensions.value = response.data.data;
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	};

	refresh();

	return { extensions, loading, error, refresh };
});
