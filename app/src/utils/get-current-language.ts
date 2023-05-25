import { useUserStore } from '@/stores/user';

export function getCurrentLanguage(fallback = 'en-US') {
	const usersStore = useUserStore();

	if (usersStore.currentUser && 'language' in usersStore.currentUser && usersStore.currentUser.language) {
		return usersStore.currentUser.language;
	}

	return fallback;
}
