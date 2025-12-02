import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Global application state
 */
export const useAppStore = defineStore('appStore', () => {
	/** Toggled visibility state notifications drawer */
	const notificationsDrawerOpen = ref(false);

	/** Full screen hides the sidebars completely */
	const fullScreen = ref(false);

	/** Have all stores been hydrated. This indicates that the app is ready to be rendered */
	const hydrated = ref(false);

	/** Stores are currently being hydrated */
	const hydrating = ref(false);

	/** Global hydration error. App should not be rendered */
	const error = ref(null);

	/** Is the current user authenticated. @TODO maybe move to userStore */
	const authenticated = ref(false);

	/** How long until the access token will expire */
	const accessTokenExpiry = ref(0);

	/** What basemap provider should be used in global map interfaces */
	const basemap = ref('OpenStreetMap');

	return {
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
