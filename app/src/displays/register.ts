import { App } from 'vue';
import registerComponent from '@/utils/register-component/';
import { getDisplays } from './index';
import { Component } from 'vue';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { DisplayConfig } from './types';
// @TODO3 tiny-async-pool relies on node.js global variables
import asyncPool from 'tiny-async-pool/lib/es7.js';

const { displaysRaw } = getDisplays();

export async function registerDisplays(app: App) {
	const displayModules = import.meta.globEager('./*/**/index.ts');

	const displays: DisplayConfig[] = Object.values(displayModules).map((module) => module.default);
	try {
		const customResponse = await api.get('/extensions/displays/');
		const customDisplays: string[] = customResponse.data.data || [];

		await asyncPool(5, customDisplays, async (displayName) => {
			try {
				const result = await import(/* @vite-ignore */ getRootPath() + `extensions/displays/${displayName}/index.js`);
				displays.push(result.default);
			} catch (err) {
				console.warn(`Couldn't load custom displays "${displayName}":`, err);
			}
		});
	} catch {
		console.warn(`Couldn't load custom displays`);
	}

	displaysRaw.value = displays;

	displaysRaw.value.forEach((display) => {
		if (typeof display.handler !== 'function') {
			registerComponent('display-' + display.id, display.handler as Component);
		}

		if (typeof display.options !== 'function') {
			registerComponent('display-options-' + display.id, display.options as Component);
		}
	});
}
