import { App } from 'vue';
import { getPanels } from './index';
import { PanelConfig } from '@directus/shared/types';
import { getExtensions } from '@/extensions';

const { panelsRaw } = getPanels();

export function registerPanels(app: App): void {
	const panelModules = import.meta.globEager('./*/**/index.ts');

	const panels: PanelConfig[] = Object.values(panelModules).map((module) => module.default);

	const customPanels = getExtensions('panel');
	panels.push(...customPanels);

	panelsRaw.value = panels;

	panelsRaw.value.forEach((panel: PanelConfig) => {
		app.component(`panel-${panel.id}`, panel.component);

		if (typeof panel.options !== 'function' && Array.isArray(panel.options) === false && panel.options !== null) {
			app.component(`panel-options-${panel.id}`, panel.options);
		}
	});
}
