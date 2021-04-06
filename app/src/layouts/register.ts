import registerComponent from '@/utils/register-component/';
import { getLayouts } from './index';
import api from '@/api';
import { batchPromises } from '@/utils/paginate';

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
		const data = customResponse.data.data;

		if (data && Array.isArray(data) && data.length > 0) {
			const loadedLayouts = await batchPromises(
				data,
				5,
				(customKey) => import(/* webpackIgnore: true */ `/extensions/layouts/${customKey}/index.js`)
			);

			loadedLayouts.forEach((result, i) => {
				if (result.status === 'rejected') {
					console.warn(`Couldn't load custom layout "${data[i]}"`);
					console.warn(result.reason);
				} else {
					modules.push(result.value.default);
				}
			});
		}
	} catch {
		console.warn(`Couldn't load custom layouts`);
	}

	layouts.value = modules;

	layouts.value.forEach((layout) => {
		registerComponent('layout-' + layout.id, layout.component);
	});
}
