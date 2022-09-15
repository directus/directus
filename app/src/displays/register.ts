import { App } from 'vue';
import { getDisplays } from './index';
import { DisplayConfig } from '@directus/shared/types';
import { getExtensions } from '@/extensions';

const { displaysRaw } = getDisplays();

export function registerDisplays(app: App): void {
	const displayModules = import.meta.globEager('./*/**/index.ts');

	const displays: DisplayConfig[] = Object.values(displayModules).map((module) => module.default);

	const customDisplays = getExtensions('display');
	displays.push(...customDisplays);

	displaysRaw.value = displays;

	displaysRaw.value.forEach((display: DisplayConfig) => {
		app.component(`display-${display.id}`, display.component);

		if (typeof display.options !== 'function' && Array.isArray(display.options) === false && display.options !== null) {
			app.component(`display-options-${display.id}`, display.options);
		}
	});
}
