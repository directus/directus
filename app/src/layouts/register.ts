import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
// @TODO3 tiny-async-pool relies on node.js global variables
import asyncPool from 'tiny-async-pool/lib/es7.js';
import { App } from 'vue';
import { getLayouts } from './index';
import { LayoutConfig } from './types';

const { layoutsRaw } = getLayouts();

export async function registerLayouts(app: App): Promise<void> {
	// const layoutModules = import.meta.globEager('./*/**/index.ts');
	const layoutModules = import.meta.globEager('./(tabular|cards)/index.ts');

	const layouts: LayoutConfig[] = Object.values(layoutModules).map((module) => module.default);

	try {
		const customResponse = await api.get('/extensions/layouts/');
		const customLayouts: string[] = customResponse.data.data || [];

		await asyncPool(5, customLayouts, async (layoutName) => {
			try {
				const result = await import(/* @vite-ignore */ `${getRootPath()}extensions/layouts/${layoutName}/index.js`);
				layouts.push(result.default);
			} catch (err) {
				console.warn(`Couldn't load custom layout "${layoutName}":`, err);
			}
		});
	} catch {
		console.warn(`Couldn't load custom layouts`);
	}

	layoutsRaw.value = layouts;

	layoutsRaw.value.forEach((layout) => {
		app.component('layout-' + layout.id, layout.component);
		app.component('layout-options-' + layout.id, layout.slots.options);
		app.component('layout-sidebar-' + layout.id, layout.slots.sidebar);
		app.component('layout-actions-' + layout.id, layout.slots.actions);
	});
}
