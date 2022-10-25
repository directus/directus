import { App } from 'vue';
import { DisplayConfig } from '@directus/shared/types';
import { getSortedModules } from '@/utils/get-sorted-modules';

export function getInternalDisplays(): DisplayConfig[] {
	const displays = import.meta.glob<{ default: DisplayConfig }>('./*/index.ts', { eager: true });

	return getSortedModules(displays, './*/index.ts');
}

export function registerDisplays(displays: DisplayConfig[], app: App): void {
	for (const display of displays) {
		app.component(`display-${display.id}`, display.component);

		if (typeof display.options !== 'function' && Array.isArray(display.options) === false && display.options !== null) {
			app.component(`display-options-${display.id}`, display.options);
		}
	}
}
