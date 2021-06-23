import { getRootPath } from '@/utils/get-root-path';
import { App } from 'vue';
import { getPanels } from './index';
import { PanelConfig } from './types';

const { panelsRaw } = getPanels();

export async function registerPanels(app: App): Promise<void> {
	const interfaceModules = import.meta.globEager('./*/**/index.ts');

	const panels: PanelConfig[] = Object.values(interfaceModules).map((module) => module.default);

	try {
		const customPanels: { default: PanelConfig[] } = import.meta.env.DEV
			? await import('@directus-extensions-interface')
			: await import(/* @vite-ignore */ `${getRootPath()}extensions/panels/index.js`);

		panels.push(...customPanels.default);
	} catch {
		// eslint-disable-next-line no-console
		console.warn(`Couldn't load custom panels`);
	}

	panelsRaw.value = panels;

	panelsRaw.value.forEach((inter: PanelConfig) => {
		app.component('interface-' + inter.id, inter.component);

		if (typeof inter.options !== 'function' && Array.isArray(inter.options) === false) {
			app.component(`interface-options-${inter.id}`, inter.options);
		}
	});
}
