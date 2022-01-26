import { defineStore } from 'pinia';

export const useAppStore = defineStore({
	id: 'appStore',
	state: () => ({
		sidebarOpen: false,
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
