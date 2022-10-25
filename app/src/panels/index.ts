import { App } from 'vue';
import { PanelConfig } from '@directus/shared/types';
import { getSortedModules } from '@/utils/get-sorted-modules';

export function getInternalPanels(): PanelConfig[] {
	const panels = import.meta.glob<{ default: PanelConfig }>('./*/index.ts', { eager: true });

	return getSortedModules(panels, './*/index.ts');
}

export function registerPanels(panels: PanelConfig[], app: App): void {
	for (const panel of panels) {
		app.component(`panel-${panel.id}`, panel.component);

		if (typeof panel.options !== 'function' && Array.isArray(panel.options) === false && panel.options !== null) {
			app.component(`panel-options-${panel.id}`, panel.options);
		}
	}
}
