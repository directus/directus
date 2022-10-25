import { App } from 'vue';
import { LayoutConfig } from '@directus/shared/types';
import { getSortedModules } from '@/utils/get-sorted-modules';

export function getInternalLayouts(): LayoutConfig[] {
	const layouts = import.meta.glob<{ default: LayoutConfig }>('./*/index.ts', { eager: true });

	return getSortedModules(layouts, './*/index.ts');
}

export function registerLayouts(layouts: LayoutConfig[], app: App): void {
	for (const layout of layouts) {
		app.component(`layout-${layout.id}`, layout.component);
		app.component(`layout-options-${layout.id}`, layout.slots.options);
		app.component(`layout-sidebar-${layout.id}`, layout.slots.sidebar);
		app.component(`layout-actions-${layout.id}`, layout.slots.actions);
	}
}
