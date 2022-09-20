import { App } from 'vue';
import { LayoutConfig } from '@directus/shared/types';

export function getInternalLayouts(): LayoutConfig[] {
	const layouts = import.meta.globEager('./*/index.ts');

	return Object.values(layouts).map((module) => module.default);
}

export function registerLayouts(layouts: LayoutConfig[], app: App): void {
	for (const layout of layouts) {
		app.component(`layout-${layout.id}`, layout.component);
		app.component(`layout-options-${layout.id}`, layout.slots.options);
		app.component(`layout-sidebar-${layout.id}`, layout.slots.sidebar);
		app.component(`layout-actions-${layout.id}`, layout.slots.actions);
	}
}
