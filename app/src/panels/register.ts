// import api from '@/api';
// import { getRootPath } from '@/utils/get-root-path';
import registerComponent from '@/utils/register-component/';
// import asyncPool from 'tiny-async-pool';
import { Component } from 'vue';
import { getPanels } from './index';
import { PanelConfig } from './types';

const { panelsRaw } = getPanels();

export async function registerPanels(): Promise<void> {
	const context = require.context('.', true, /^.*index\.ts$/);

	const modules = context
		.keys()
		.map((key) => context(key))
		.map((mod) => mod.default)
		.filter((m) => m);

	// try {
	// 	const customResponse = await api.get('/extensions/panels/');
	// 	const panels: string[] = customResponse.data.data || [];

	// 	await asyncPool(5, panels, async (panelName) => {
	// 		try {
	// 			const result = await import(
	// 				/* webpackIgnore: true */ getRootPath() + `extensions/panels/${panelName}/index.js`
	// 			);
	// 			modules.push(result.default);
	// 		} catch (err) {
	// 			console.warn(`Couldn't load custom panel "${panelName}":`, err);
	// 		}
	// 	});
	// } catch {
	// 	console.warn(`Couldn't load custom panels`);
	// }

	panelsRaw.value = modules;

	panelsRaw.value.forEach((panel: PanelConfig) => {
		registerComponent('panel-' + panel.id, panel.component);

		if (typeof panel.options !== 'function' && Array.isArray(panel.options) === false) {
			registerComponent(`panel-options-${panel.id}`, panel.options as Component);
		}
	});
}
