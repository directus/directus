import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
// @TODO3 tiny-async-pool relies on node.js global variables
import asyncPool from 'tiny-async-pool/lib/es7.js';
import { App } from 'vue';
import { getDisplays } from './index';
import { DisplayConfig } from './types';

const { displaysRaw } = getDisplays();

export async function registerDisplays(app: App): Promise<void> {
	const displayModules = import.meta.globEager('./*/**/index.ts');

	const displays: DisplayConfig[] = Object.values(displayModules).map((module) => module.default);
	try {
		const customResponse = await api.get('/extensions/displays/');
		const customDisplays: string[] = customResponse.data.data || [];

		await asyncPool(5, customDisplays, async (displayName) => {
			try {
				const result = await import(/* @vite-ignore */ `${getRootPath()}extensions/displays/${displayName}/index.js`);
				displays.push(result.default);
			} catch (err) {
				console.warn(`Couldn't load custom displays "${displayName}":`, err);
			}
		});
	} catch {
		console.warn(`Couldn't load custom displays`);
	}

	displaysRaw.value = displays;

	displaysRaw.value.forEach((display: DisplayConfig) => {
		if (typeof display.handler !== 'function') {
			app.component('display-' + display.id, display.handler);
		}

		if (typeof display.options !== 'function' && display.options !== null) {
			app.component('display-options-' + display.id, display.options);
		}
	});
}
