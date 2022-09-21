import { AppExtensionConfigs, RefRecord } from '@directus/shared/types';
import { App, shallowRef, watch } from 'vue';
import { getInternalDisplays, registerDisplays } from './displays';
import { getInternalInterfaces, registerInterfaces } from './interfaces';
import { i18n } from './lang';
import { getInternalLayouts, registerLayouts } from './layouts';
import { getInternalModules, registerModules } from './modules';
import { getInternalOperations, registerOperations } from './operations';
import { getInternalPanels, registerPanels } from './panels';
import { getRootPath } from './utils/get-root-path';
import { translate } from './utils/translate-object-values';

let customExtensions: AppExtensionConfigs | null = null;

const extensions: RefRecord<AppExtensionConfigs> = {
	interfaces: shallowRef([]),
	displays: shallowRef([]),
	layouts: shallowRef([]),
	modules: shallowRef([]),
	panels: shallowRef([]),
	operations: shallowRef([]),
};

export async function loadExtensions(): Promise<void> {
	try {
		customExtensions = import.meta.env.DEV
			? await import('@directus-extensions')
			: await import(/* @vite-ignore */ `${getRootPath()}extensions/sources/index.js`);
	} catch (err: any) {
		// eslint-disable-next-line no-console
		console.warn(`Couldn't load extensions`);
		// eslint-disable-next-line no-console
		console.warn(err);
	}
}

export function registerExtensions(app: App): void {
	if (customExtensions === null) return;

	const interfaces = [...getInternalInterfaces(), ...customExtensions.interfaces];
	const displays = [...getInternalDisplays(), ...customExtensions.displays];
	const layouts = [...getInternalLayouts(), ...customExtensions.layouts];
	const modules = [...getInternalModules(), ...customExtensions.modules];
	const panels = [...getInternalPanels(), ...customExtensions.panels];
	const operations = [...getInternalOperations(), ...customExtensions.operations];

	registerInterfaces(interfaces, app);
	registerDisplays(displays, app);
	registerLayouts(layouts, app);
	registerPanels(panels, app);
	registerOperations(operations, app);

	watch(
		i18n.global.locale,
		() => {
			extensions.interfaces.value = translate(interfaces);
			extensions.displays.value = translate(displays);
			extensions.layouts.value = translate(layouts);
			extensions.panels.value = translate(panels);
			extensions.operations.value = translate(operations);
		},
		{ immediate: true }
	);

	const registeredModules = registerModules(modules);

	watch(
		[i18n.global.locale, registeredModules],
		() => {
			extensions.modules.value = translate(registeredModules.value);
		},
		{ immediate: true }
	);
}

export function useExtensions(): RefRecord<AppExtensionConfigs> {
	return extensions;
}
