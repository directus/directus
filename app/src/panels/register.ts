import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { asyncPool } from '@/utils/async-pool';
import { App } from 'vue';
import { getPanels } from './index';
import { PanelConfig } from './types';

const { panelsRaw } = getPanels();

export async function registerPanels(app: App): Promise<void> {
	const panelModules = import.meta.globEager('./*/**/index.ts');

	const panels: PanelConfig[] = Object.values(panelModules).map((module) => module.default);

	try {
		const customResponse = await api.get('/extensions/panels/');
		const customPanels: string[] = customResponse.data.data || [];

		await asyncPool(5, customPanels, async (panelName) => {
			try {
				const result = await import(/* @vite-ignore */ `${getRootPath()}extensions/panels/${panelName}/index.js`);
				panels.push(result.default);
			} catch (err) {
				console.warn(`Couldn't load custom panel "${panelName}":`, err);
			}
		});
	} catch {
		console.warn(`Couldn't load custom panels`);
	}

	panelsRaw.value = panels;

	panelsRaw.value.forEach((panel: PanelConfig) => {
		app.component('panel-' + panel.id, panel.component);

		if (typeof panel.options !== 'function' && Array.isArray(panel.options) === false) {
			app.component(`panel-options-${panel.id}`, panel.options);
		}
	});
}
