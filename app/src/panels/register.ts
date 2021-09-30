import { getRootPath } from '@/utils/get-root-path';
import { App } from 'vue';
import { getPanels } from './index';
import { PanelConfig } from '@directus/shared/types';

const { panelsRaw } = getPanels();

export async function registerPanels(app: App): Promise<void> {
	const panelModules = import.meta.globEager('./*/**/index.ts');

	const panels: PanelConfig[] = Object.values(panelModules).map((module) => module.default);

	try {
		const customPanels: { default: PanelConfig[] } = import.meta.env.DEV
			? await import('@directus-extensions-panel')
			: await import(/* @vite-ignore */ `${getRootPath()}extensions/panels/index.js`);

		panels.push(...customPanels.default);
	} catch {
		// eslint-disable-next-line no-console
		console.warn(`Couldn't load custom panels`);
	}

	panelsRaw.value = panels;

	panelsRaw.value.forEach((inter: PanelConfig) => {
		app.component('panel-' + inter.id, inter.component);

		if (typeof inter.options !== 'function' && Array.isArray(inter.options) === false) {
			app.component(`panel-options-${inter.id}`, inter.options);
		}
	});
}
