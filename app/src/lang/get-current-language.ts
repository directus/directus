import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';

export function getCurrentLanguage(fallback = 'en-US') {
	const usersStore = useUserStore();
	const serverStore = useServerStore();

	let lang = fallback;

	if (serverStore.info?.project?.default_language) lang = serverStore.info.project.default_language;

	if (usersStore.currentUser && 'language' in usersStore.currentUser && usersStore.currentUser.language) {
		lang = usersStore.currentUser.language;
	}

	return lang;
}
