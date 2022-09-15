import { App } from 'vue';
import { getLayouts } from './index';
import { LayoutConfig } from '@directus/shared/types';
import { getExtensions } from '@/extensions';

const { layoutsRaw } = getLayouts();

export function registerLayouts(app: App): void {
	const layoutModules = import.meta.globEager('./*/**/index.ts');

	const layouts: LayoutConfig[] = Object.values(layoutModules).map((module) => module.default);

	const customLayouts = getExtensions('layout');
	layouts.push(...customLayouts);

	layoutsRaw.value = layouts;

	layoutsRaw.value.forEach((layout) => {
		app.component(`layout-${layout.id}`, layout.component);
		app.component(`layout-options-${layout.id}`, layout.slots.options);
		app.component(`layout-sidebar-${layout.id}`, layout.slots.sidebar);
		app.component(`layout-actions-${layout.id}`, layout.slots.actions);
	});
}
