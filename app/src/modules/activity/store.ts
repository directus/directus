import { Filter } from '@directus/types';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useActivityModuleStore = defineStore('activity-module', () => {
	const roleFilter = ref<Filter | null>(null);

	return { roleFilter };
});
