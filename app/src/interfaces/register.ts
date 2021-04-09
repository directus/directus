import registerComponent from '@/utils/register-component/';
import { getInterfaces } from './index';
import { Component } from 'vue';
import api from '@/api';
import { batchPromises } from '@/utils/paginate';
import { getRootPath } from '@/utils/get-root-path';

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
		const data = customResponse.data.data as string[];

		if (data && Array.isArray(data) && data.length > 0) {
			const loadedInterfaces = await batchPromises(
				data,
				5,
				(customKey) => import(/* webpackIgnore: true */ getRootPath() + `/extensions/interfaces/${customKey}/index.js`)
			);

			loadedInterfaces.forEach((result, i) => {
				if (result.status === 'rejected') {
					console.warn(`Couldn't load custom interface "${data[i]}"`);
					console.warn(result.reason);
				} else {
					modules.push(result.value.default);
				}
			});
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
