import { useUserStore } from '@/stores';

export function getTheme(): 'light' | 'dark' {
	const userStore = useUserStore();

	if (!userStore.currentUser) return 'light';

	if (userStore.currentUser.theme === 'auto') {
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}

		return 'light';
	}

	return userStore.currentUser.theme as 'light' | 'dark';
}
