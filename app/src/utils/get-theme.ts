import { useUserStore } from '@/stores/user';

/**
 * Returns the used theme for the current user. Will check prefers-color-scheme dark if theme is
 * configured to be "auto"
 */
export function getTheme(): 'light' | 'dark' {
	const userStore = useUserStore();

	if (!userStore.currentUser || !('theme' in userStore.currentUser) || userStore.currentUser.theme === 'auto') {
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}

		return 'light';
	}

	return userStore.currentUser.theme as 'light' | 'dark';
}
