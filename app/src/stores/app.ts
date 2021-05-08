import { defineStore } from 'pinia';

export const useAppStore = defineStore({
	id: 'appStore',
	state: () => ({
		sidebarOpen: false,
		hydrated: false,
		hydrating: false,
		error: null,
		authenticated: false,
	}),
});
