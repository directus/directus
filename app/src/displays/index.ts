import { App } from 'vue';
import { DisplayConfig } from '@directus/shared/types';

export function getInternalDisplays(): DisplayConfig[] {
	const displays = import.meta.globEager('./*/index.ts');

	return Object.values(displays).map((module) => module.default);
}

export function registerDisplays(displays: DisplayConfig[], app: App): void {
	for (const display of displays) {
		app.component(`display-${display.id}`, display.component);

		if (typeof display.options !== 'function' && Array.isArray(display.options) === false && display.options !== null) {
			app.component(`display-options-${display.id}`, display.options);
		}
	}
}
