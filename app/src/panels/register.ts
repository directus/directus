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
	} catch (err: any) {
		// eslint-disable-next-line no-console
		console.warn(`Couldn't load custom panels`);
		// eslint-disable-next-line no-console
		console.warn(err);
	}

	panelsRaw.value = panels;

	panelsRaw.value.forEach((panel: PanelConfig) => {
		app.component(`panel-${panel.id}`, panel.component);

		if (typeof panel.options !== 'function' && Array.isArray(panel.options) === false && panel.options !== null) {
			app.component(`panel-options-${panel.id}`, panel.options);
		}
	});
}
