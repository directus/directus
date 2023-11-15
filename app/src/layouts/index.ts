import type { LayoutConfig } from '@directus/extensions';
import { sortBy } from 'lodash';
import { App } from 'vue';

export function getInternalLayouts(): LayoutConfig[] {
	const layouts = import.meta.glob<LayoutConfig>('./*/index.ts', { import: 'default', eager: true });

	return sortBy(Object.values(layouts), 'id');
}

export function registerLayouts(layouts: LayoutConfig[], app: App): void {
	for (const layout of layouts) {
		app.component(`layout-${layout.id}`, layout.component);
		app.component(`layout-options-${layout.id}`, layout.slots.options);
		app.component(`layout-sidebar-${layout.id}`, layout.slots.sidebar);
		app.component(`layout-actions-${layout.id}`, layout.slots.actions);
	}
}
