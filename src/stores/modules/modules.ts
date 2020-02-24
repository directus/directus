import { createStore } from 'pinia';
import { Module } from '@/types/modules';

export const useModulesStore = createStore({
	id: 'modules',
	state: () => ({
		modules: [] as Module[]
	})
});
