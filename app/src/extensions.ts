import { getInternalDisplays, registerDisplays } from './displays';
import { getInternalInterfaces, registerInterfaces } from './interfaces';
import { i18n } from './lang';
import { getInternalLayouts, registerLayouts } from './layouts';
import { getInternalModules, registerModules } from './modules';
import { getInternalOperations, registerOperations } from './operations';
import { getInternalPanels, registerPanels } from './panels';
import { registerThemes } from './themes/register';
import { getRootPath } from './utils/get-root-path';
import { translate } from './utils/translate-object-values';
import type { AppExtensionConfigs, RefRecord } from '@directus/types';
import { App, shallowRef, watch } from 'vue';

let customExtensions: AppExtensionConfigs | null = null;

const extensions: RefRecord<AppExtensionConfigs> = {
	interfaces: shallowRef([]),
	displays: shallowRef([]),
	layouts: shallowRef([]),
	modules: shallowRef([]),
	panels: shallowRef([]),
	operations: shallowRef([]),
	themes: shallowRef([]),
};

const onHydrateCallbacks: (() => Promise<void>)[] = [];
const onDehydrateCallbacks: (() => Promise<void>)[] = [];

export async function loadExtensions(): Promise<void> {
	try {
		customExtensions = import.meta.env.DEV
			? await import(/* @vite-ignore */ '@directus-extensions')
			: await import(/* @vite-ignore */ `${getRootPath()}extensions/sources/index.js`);
	} catch (err: any) {
		// eslint-disable-next-line no-console
		console.warn(`Couldn't load extensions`);
		// eslint-disable-next-line no-console
		console.warn(err);
	}
}

export function registerExtensions(app: App): void {
	const interfaces = getInternalInterfaces();
	const displays = getInternalDisplays();
	const layouts = getInternalLayouts();
	const modules = getInternalModules();
	const panels = getInternalPanels();
	const operations = getInternalOperations();
	const themes = []; // Themes is the first extension type that doesn't rely on internally scoped extensions

	if (customExtensions !== null) {
		interfaces.push(...customExtensions.interfaces);
		displays.push(...customExtensions.displays);
		layouts.push(...customExtensions.layouts);
		modules.push(...customExtensions.modules);
		panels.push(...customExtensions.panels);
		operations.push(...customExtensions.operations);
		themes.push(...customExtensions.themes);
	}

	registerInterfaces(interfaces, app);
	registerDisplays(displays, app);
	registerLayouts(layouts, app);
	registerPanels(panels, app);
	registerOperations(operations, app);
	registerThemes(themes);

	watch(
		i18n.global.locale,
		() => {
			extensions.interfaces.value = translate(interfaces);
			extensions.displays.value = translate(displays);
			extensions.layouts.value = translate(layouts);
			extensions.panels.value = translate(panels);
			extensions.operations.value = translate(operations);
		},
		{ immediate: true },
	);

	const { registeredModules, onHydrateModules, onDehydrateModules } = registerModules(modules);

	watch(
		[i18n.global.locale, registeredModules],
		() => {
			extensions.modules.value = translate(registeredModules.value);
		},
		{ immediate: true },
	);

	onHydrateCallbacks.push(onHydrateModules);
	onDehydrateCallbacks.push(onDehydrateModules);
}

export async function onHydrateExtensions() {
	await Promise.all(onHydrateCallbacks.map((onHydrate) => onHydrate()));
}

export async function onDehydrateExtensions() {
	await Promise.all(onDehydrateCallbacks.map((onDehydrate) => onDehydrate()));
}

export function useExtensions(): RefRecord<AppExtensionConfigs> {
	return extensions;
}
