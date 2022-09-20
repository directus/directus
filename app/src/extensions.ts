import { AppExtensionConfigs } from '@directus/shared/types';
import { App, shallowRef, UnwrapRef, watch } from 'vue';
import { getInternalDisplays, registerDisplays } from './displays/register';
import { getInternalInterfaces, registerInterfaces } from './interfaces/register';
import { i18n } from './lang';
import { getInternalLayouts, registerLayouts } from './layouts/register';
import { getInternalModules, registerModules } from './modules/register';
import { getInternalOperations, registerOperations } from './operations/register';
import { getInternalPanels, registerPanels } from './panels/register';
import { getRootPath } from './utils/get-root-path';
import { translate } from './utils/translate-object-values';

let customExtensions: UnwrapRef<AppExtensionConfigs> | null = null;

const extensions: AppExtensionConfigs = {
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

export function useExtensions(): AppExtensionConfigs {
	return extensions;
}
