import { createStore } from 'pinia';

export const useAppStore = createStore({
	id: 'appStore',
	state: () => ({
		hydrated: false,
		hydrating: false,
		error: null
	})
});
