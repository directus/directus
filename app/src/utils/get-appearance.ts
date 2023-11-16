import { useUserStore } from '@/stores/user';

/**
 * Returns the used appearance for the current user. Will check prefers-color-scheme dark if
 * appearance is configured to be "auto"
 */
export function getAppearance(): 'light' | 'dark' {
	const userStore = useUserStore();

	if (
		!userStore.currentUser ||
		!('appearance' in userStore.currentUser) ||
		userStore.currentUser.appearance === 'auto'
	) {
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}

		return 'light';
	}

	return userStore.currentUser.appearance as 'light' | 'dark';
}
