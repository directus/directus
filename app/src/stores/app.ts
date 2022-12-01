import { defineStore } from 'pinia';
import { useLocalStorage } from '@/composables/use-local-storage';

export const useAppStore = defineStore({
	id: 'appStore',
	state: () => ({
		sidebarOpen: useLocalStorage('app-store-sidebar-open', window.innerWidth >= 1430).data,
		notificationsDrawerOpen: false,
		fullScreen: false,
		hydrated: false,
		hydrating: false,
		error: null,
		authenticated: false,
		accessTokenExpiry: 0,
		basemap: 'OpenStreetMap',
	}),
});
