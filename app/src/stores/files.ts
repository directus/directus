import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useFilesStore = defineStore('filesStore', () => {
	const uploading = ref(false);

	return {
		uploading,
	};
});
