import { getRootPath } from '@/utils/get-root-path';
import { App } from 'vue';
import { getDisplays } from './index';
import { DisplayConfig } from '@directus/shared/types';

const { displaysRaw } = getDisplays();

export async function registerDisplays(app: App): Promise<void> {
	const displayModules = import.meta.globEager('./*/**/index.ts');

	const displays: DisplayConfig[] = Object.values(displayModules).map((module) => module.default);
	try {
		const customDisplays: { default: DisplayConfig[] } = import.meta.env.DEV
			? await import('@directus-extensions-display')
			: await import(/* @vite-ignore */ `${getRootPath()}extensions/displays/index.js`);

		displays.push(...customDisplays.default);
	} catch (err: any) {
		// eslint-disable-next-line no-console
		console.warn(`Couldn't load custom displays`);
		// eslint-disable-next-line no-console
		console.warn(err);
	}

	displaysRaw.value = displays;

	displaysRaw.value.forEach((display: DisplayConfig) => {
		app.component(`display-${display.id}`, display.component);

		if (typeof display.options !== 'function' && Array.isArray(display.options) === false && display.options !== null) {
			app.component(`display-options-${display.id}`, display.options);
		}
	});
}
