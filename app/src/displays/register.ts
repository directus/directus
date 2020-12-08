import registerComponent from '@/utils/register-component/';
import { getDisplays } from './index';
import { Component } from 'vue';
import api from '@/api';

const displays = getDisplays();

export async function registerDisplays() {
	const context = require.context('.', true, /^.*index\.ts$/);

	const modules = context
		.keys()
		.map((key) => context(key))
		.map((mod) => mod.default)
		.filter((m) => m);

	try {
		const customResponse = await api.get('/extensions/displays');

		if (customResponse.data.data && Array.isArray(customResponse.data.data) && customResponse.data.data.length > 0) {
			for (const customKey of customResponse.data.data) {
				try {
					const module = await import(/* webpackIgnore: true */ `/extensions/displays/${customKey}/index.js`);
					modules.push(module.default);
				} catch (err) {
					console.warn(`Couldn't load custom displays "${customKey}"`);
					console.warn(err);
				}
			}
		}
	} catch {
		console.warn(`Couldn't load custom displays`);
	}

	displays.value = modules;

	displays.value.forEach((display) => {
		if (typeof display.handler !== 'function') {
			registerComponent('display-' + display.id, display.handler as Component);
		}

		if (typeof display.options !== 'function') {
			registerComponent('display-options-' + display.id, display.options as Component);
		}
	});
}
