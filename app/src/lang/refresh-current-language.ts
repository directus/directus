import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import { useTranslationsStore } from '@/stores/translations';
import { useFieldsStore } from '@/stores/fields';

export async function refreshCurrentLanguage(fallback = 'en-US') {
	const fieldsStore = useFieldsStore();
	const serverStore = useServerStore();
	const { currentUser } = useUserStore();
	const translationsStore = useTranslationsStore();

	let lang = fallback;

	if (serverStore.info?.project?.default_language) lang = serverStore.info.project.default_language;

	if (currentUser && 'language' in currentUser && currentUser.language) {
		lang = currentUser.language;
	}

	try {
		if (currentUser) {
			await translationsStore.loadTranslations(lang);
		}

		// Refetch fields in order to translate
		await fieldsStore.hydrate();
	} catch {
		// eslint-disable-next-line no-console
		console.error('Failed loading translations');
	}
}
