import registerComponent from '@/utils/register-component/';
import { getLayouts } from './index';
import api from '@/api';

const layouts = getLayouts();

export async function registerLayouts() {
	const context = require.context('.', true, /^.*index\.ts$/);

	const modules = context
		.keys()
		.map((key) => context(key))
		.map((mod) => mod.default)
		.filter((m) => m);

	try {
		const customResponse = await api.get('/extensions/layouts');

		if (customResponse.data.data && Array.isArray(customResponse.data.data) && customResponse.data.data.length > 0) {
			for (const customKey of customResponse.data.data) {
				try {
					const module = await import(/* webpackIgnore: true */ `/extensions/layouts/${customKey}/index.js`);
					modules.push(module.default);
				} catch (err) {
					console.warn(`Couldn't load custom layout "${customKey}"`);
					console.warn(err);
				}
			}
		}
	} catch {
		console.warn(`Couldn't load custom layouts`);
	}

	layouts.value = modules;

	layouts.value.forEach((layout) => {
		registerComponent('layout-' + layout.id, layout.component);
	});
}
