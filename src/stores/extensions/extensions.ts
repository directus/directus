import { createStore } from 'pinia';
import { Module, Layout } from '@/types/extensions';

export const useExtensionsStore = createStore({
	id: 'extensions',
	state: () => ({
		modules: [] as Module[],
		layouts: [] as Layout[]
	})
});
