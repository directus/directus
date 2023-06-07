import { useLocalStorage } from '@/composables/use-local-storage';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('appStore', () => {
	const { data: sidebarOpen } = useLocalStorage('app-store-sidebar-open', window.innerWidth >= 1430);
	const notificationsDrawerOpen = ref(false);
	const fullScreen = ref(false);
	const hydrated = ref(false);
	const hydrating = ref(false);
	const error = ref(null);
	const authenticated = ref(false);
	const accessTokenExpiry = ref(0);
	const basemap = ref('OpenStreetMap');

	return {
		sidebarOpen,
		notificationsDrawerOpen,
		fullScreen,
		hydrated,
		hydrating,
		error,
		authenticated,
		accessTokenExpiry,
		basemap,
	};
});
