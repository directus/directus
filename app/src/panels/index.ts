import type { PanelConfig } from '@directus/extensions';
import { sortBy } from 'lodash';
import { App } from 'vue';

export function getInternalPanels(): PanelConfig[] {
	const panels = import.meta.glob<PanelConfig>('./*/index.ts', { import: 'default', eager: true });

	return sortBy(Object.values(panels), 'id');
}

export function registerPanels(panels: PanelConfig[], app: App): void {
	for (const panel of panels) {
		app.component(`panel-${panel.id}`, panel.component);

		if (typeof panel.options !== 'function' && Array.isArray(panel.options) === false && panel.options !== null) {
			app.component(`panel-options-${panel.id}`, panel.options);
		}
	}
}
