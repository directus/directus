import { defineStore } from 'pinia';

export const useCacheStore = defineStore({
	id: 'cacheStore',
	state: () => ({
		images: {} as Record<string, string>,
	}),
	getters: {
		getImage: (state) => {
			return (key: string): string | undefined => {
				return state.images[key];
			};
		},
	},
	actions: {
		cacheImage(key: string, src: string) {
			this.images[key] = src;
		},
	},
});
