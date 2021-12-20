import { getDisplays } from '@/displays';
import { getInterfaces } from '@/interfaces';
import { getPanels } from '@/panels';
import { getLayouts } from '@/layouts';
import { getModules } from '@/modules';
import { useCollectionsStore, useFieldsStore } from '@/stores';
import { translate } from '@/utils/translate-object-values';
import availableLanguages from './available-languages.yaml';
import { i18n, Language, loadedLanguages } from './index';

const { modules, modulesRaw } = getModules();
const { layouts, layoutsRaw } = getLayouts();
const { interfaces, interfacesRaw } = getInterfaces();
const { panels, panelsRaw } = getPanels();
const { displays, displaysRaw } = getDisplays();

export async function setLanguage(lang: Language): Promise<boolean> {
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();

	if (Object.keys(availableLanguages).includes(lang) === false) {
		// eslint-disable-next-line no-console
		console.warn(`"${lang}" is not an available language in the Directus app.`);
	} else {
		if (loadedLanguages.includes(lang) === false) {
			try {
				const { default: translations } = await import(`./translations/${lang}.yaml`);
				i18n.global.mergeLocaleMessage(lang, translations);
				loadedLanguages.push(lang);
			} catch (err: any) {
				// eslint-disable-next-line no-console
				console.warn(err);
			}
		}

		i18n.global.locale.value = lang;

		(document.querySelector('html') as HTMLElement).setAttribute('lang', lang);
	}

	modules.value = translate(modulesRaw.value);
	layouts.value = translate(layoutsRaw.value);
	interfaces.value = translate(interfacesRaw.value);
	panels.value = translate(panelsRaw.value);
	displays.value = translate(displaysRaw.value);

	collectionsStore.translateCollections();
	fieldsStore.translateFields();

	return true;
}
