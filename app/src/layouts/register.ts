import { getRootPath } from '@/utils/get-root-path';
import { App } from 'vue';
import { getLayouts } from './index';
import { LayoutConfig } from './types';

const { layoutsRaw } = getLayouts();

export async function registerLayouts(app: App): Promise<void> {
	const layoutModules = import.meta.globEager('./*/**/index.ts');

	const layouts: LayoutConfig[] = Object.values(layoutModules).map((module) => module.default);

	try {
		if (import.meta.env.DEV) {
			const customLayoutModules = import.meta.globEager('../../../api/extensions/layouts/*/index.js');
			const customLayouts: LayoutConfig[] = Object.values(customLayoutModules).map((module) => module.default);
			layouts.push(...customLayouts);
		} else {
			const customLayouts: { default: LayoutConfig[] } = await import(
				/* @vite-ignore */ `${getRootPath()}extensions/layouts/index.js`
			);
			layouts.push(...customLayouts.default);
		}
	} catch {
		// eslint-disable-next-line no-console
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
