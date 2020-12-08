import registerComponent from '@/utils/register-component/';
import { getInterfaces } from './index';
import { Component } from 'vue';
import api from '@/api';

const interfaces = getInterfaces();

export async function registerInterfaces() {
	const context = require.context('.', true, /^.*index\.ts$/);

	const modules = context
		.keys()
		.map((key) => context(key))
		.map((mod) => mod.default)
		.filter((m) => m);

	try {
		const customResponse = await api.get('/extensions/interfaces');

		if (customResponse.data.data && Array.isArray(customResponse.data.data) && customResponse.data.data.length > 0) {
			for (const customKey of customResponse.data.data) {
				try {
					const module = await import(/* webpackIgnore: true */ `/extensions/interfaces/${customKey}/index.js`);
					modules.push(module.default);
				} catch (err) {
					console.warn(`Couldn't load custom interface "${customKey}"`);
					console.warn(err);
				}
			}
		}
	} catch {
		console.warn(`Couldn't load custom interfaces`);
	}

	interfaces.value = modules;

	interfaces.value.forEach((inter) => {
		registerComponent('interface-' + inter.id, inter.component);

		if (typeof inter.options !== 'function' && Array.isArray(inter.options) === false) {
			registerComponent(`interface-options-${inter.id}`, inter.options as Component);
		}
	});
}
