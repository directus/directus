import availableLanguages from './available-languages.yaml';
import { i18n, Language, loadedLanguages } from './index';

import { getModules } from '@/modules';
import { getLayouts } from '@/layouts';
import { getInterfaces } from '@/interfaces';
import { getDisplays } from '@/displays';
import { translate } from '@/utils/translate-object-values';

import { useCollectionsStore, useFieldsStore } from '@/stores';

const { modules, modulesRaw } = getModules();
const { layouts, layoutsRaw } = getLayouts();
const { interfaces, interfacesRaw } = getInterfaces();
const { displays, displaysRaw } = getDisplays();

export async function setLanguage(lang: Language): Promise<boolean> {
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();

	if (Object.keys(availableLanguages).includes(lang) === false) {
		return false;
	}

	if (loadedLanguages.includes(lang) === false) {
		const translations = await import(`@/lang/translations/${lang}.yaml`).catch((err) => console.warn(err));
		i18n.mergeLocaleMessage(lang, translations);
		loadedLanguages.push(lang);
	}

	i18n.locale = lang;

	(document.querySelector('html') as HTMLElement).setAttribute('lang', lang);

	modules.value = translate(modulesRaw.value);
	layouts.value = translate(layoutsRaw.value);
	interfaces.value = translate(interfacesRaw.value);
	displays.value = translate(displaysRaw.value);

	collectionsStore.translateCollections();
	fieldsStore.translateFields();

	return true;
}
