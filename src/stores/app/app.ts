import { createStore } from 'pinia';

export const useAppStore = createStore({
	id: 'app',
	state: () => ({
		hydrated: false,
		hydrating: false,
		error: null
	})
});
