import { defineStore } from 'pinia';
import { LocalStorageObject } from '@/utils/local-storage-object';

const sidebarOpenObject = new LocalStorageObject('appStoreSidebarOpen', window.innerWidth >= 1430);

export const useAppStore = defineStore({
	id: 'appStore',
	state: () => ({
		sidebarOpen: sidebarOpenObject.getValue(),
		notificationsDrawerOpen: false,
		fullScreen: false,
		hydrated: false,
		hydrating: false,
		error: null,
		authenticated: false,
		accessTokenExpiry: 0,
		basemap: 'OpenStreetMap',
	}),
	actions: {
		setSidebarOpen(isOpen: boolean) {
			this.sidebarOpen = sidebarOpenObject.setValue(isOpen);
		},
	},
});
