import { useFieldsStore } from '@/stores/fields';
import { useTranslationsStore } from '@/stores/translations';
import { useUserStore } from '@/stores/user';

export async function refreshCurrentLanguage() {
	const fieldsStore = useFieldsStore();
	const userStore = useUserStore();
	const translationsStore = useTranslationsStore();

	try {
		await translationsStore.loadTranslations(userStore.language);

		// Refetch fields in order to translate
		await fieldsStore.hydrate();
	} catch {
		// oxlint-disable-next-line no-console
		console.error('Failed loading translations');
	}
}
