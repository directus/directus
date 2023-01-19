import { defineStore } from 'pinia';

// Note: This cache should not contain data that will expand in size
export const useImageCacheStore = defineStore({
	id: 'imageCacheStore',
	state: () => ({
		moduleBarLogo: undefined as string | undefined,
		moduleBarAvatar: undefined as string | undefined,
	}),
	getters: {
		getModuleBarLogo: (state) => {
			return (): string | undefined => {
				return state.moduleBarLogo;
			};
		},
		getModuleBarAvatar: (state) => {
			return (): string | undefined => {
				return state.moduleBarAvatar;
			};
		},
	},
	actions: {
		cacheModuleBarLogo(src: string) {
			this.moduleBarLogo = src;
		},
		cacheModuleBarAvatar(src: string) {
			this.moduleBarAvatar = src;
		},
	},
});
