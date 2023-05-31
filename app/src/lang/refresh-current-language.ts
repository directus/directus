import { useUserStore } from '@/stores/user';
import { useTranslationsStore } from '@/stores/translations';
import { useFieldsStore } from '@/stores/fields';
import { getCurrentLanguage } from './get-current-language';

export async function refreshCurrentLanguage(fallback = 'en-US') {
	const fieldsStore = useFieldsStore();
	const { currentUser } = useUserStore();
	const translationsStore = useTranslationsStore();
	const lang = getCurrentLanguage(fallback);

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
