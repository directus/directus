import { createStore } from 'pinia';

export const useAppStore = createStore({
	id: 'appStore',
	state: () => ({
		sidebarOpen: false,
		hydrated: false,
		hydrating: false,
		error: null,
		authenticated: false,
	}),
});
