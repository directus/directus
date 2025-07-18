import { RTL_LANGUAGES } from '@/constants/language-direction';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import { isIn } from '@directus/utils';
import { get } from 'lodash';

export function getCurrentLanguage(fallback = 'en-US') {
	const usersStore = useUserStore();
	const serverStore = useServerStore();

	const lang = get(
		usersStore,
		['currentUser', 'language'],
		get(serverStore, ['info', 'project', 'default_language'], fallback),
	) ?? fallback;

	let dir = get(usersStore, ['currentUser', 'language_direction'], 'auto');

	if (dir !== 'ltr' && dir !== 'rtl') {
		dir = isIn(lang, RTL_LANGUAGES) ? 'rtl' : 'ltr';
	}

	return { lang, dir };
}
