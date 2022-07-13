import { getRootPath } from '@/utils/get-root-path';
import { DisplayConfig, InterfaceConfig, LayoutConfig, ModuleConfig, PanelConfig } from '@directus/shared/types';

let externalExtensions: any[] = [];
const loaded = false;

async function loadExternalExtensions() {
	const module = await import(/* @vite-ignore */ `${getRootPath()}extensions/app/index.js`);
	if (module && module.default) externalExtensions = module.default;
}

export async function getExternalDisplays(): Promise<DisplayConfig[]> {
	if (!loaded) await loadExternalExtensions();

	return externalExtensions.filter((extension) => extension.extensionType === 'display');
}

export async function getExternalInterfaces(): Promise<InterfaceConfig[]> {
	if (!loaded) await loadExternalExtensions();

	return externalExtensions.filter((extension) => extension.extensionType === 'interface');
}

export async function getExternalPanels(): Promise<PanelConfig[]> {
	if (!loaded) await loadExternalExtensions();

	return externalExtensions.filter((extension) => extension.extensionType === 'panel');
}

export async function getExternalModules(): Promise<ModuleConfig[]> {
	if (!loaded) await loadExternalExtensions();

	return externalExtensions.filter((extension) => extension.extensionType === 'module');
}

export async function getExternalLayouts(): Promise<LayoutConfig[]> {
	if (!loaded) await loadExternalExtensions();

	return externalExtensions.filter((extension) => extension.extensionType === 'layout');
}
