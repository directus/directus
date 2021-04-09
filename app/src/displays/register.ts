import registerComponent from '@/utils/register-component/';
import { getDisplays } from './index';
import { Component } from 'vue';
import api from '@/api';
import { batchPromises } from '@/utils/paginate';
import { getRootPath } from '@/utils/get-root-path';

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
		const data = customResponse.data.data;

		if (data && Array.isArray(data) && data.length > 0) {
			const loadedDisplays = await batchPromises(
				data,
				5,
				(customKey) => import(/* webpackIgnore: true */ getRootPath() + `/extensions/displays/${customKey}/index.js`)
			);

			loadedDisplays.forEach((result, i) => {
				if (result.status === 'rejected') {
					console.warn(`Couldn't load custom layout "${data[i]}"`);
					console.warn(result.reason);
				} else {
					modules.push(result.value.default);
				}
			});
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
