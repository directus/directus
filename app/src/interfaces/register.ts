import registerComponent from '@/utils/register-component/';
import { getInterfaces } from './index';
import { Component } from 'vue';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import asyncPool from 'tiny-async-pool';
import { InterfaceConfig } from './types';

const { interfacesRaw } = getInterfaces();

export async function registerInterfaces(): Promise<void> {
	const context = require.context('.', true, /^.*index\.ts$/);

	const modules = context
		.keys()
		.map((key) => context(key))
		.map((mod) => mod.default)
		.filter((m) => m);

	try {
		const customResponse = await api.get('/extensions/interfaces/');
		const interfaces: string[] = customResponse.data.data || [];

		await asyncPool(5, interfaces, async (interfaceName) => {
			try {
				const result = await import(
					/* webpackIgnore: true */ getRootPath() + `extensions/interfaces/${interfaceName}/index.js`
				);
				modules.push(result.default);
			} catch (err) {
				console.warn(`Couldn't load custom interface "${interfaceName}":`, err);
			}
		});
	} catch {
		console.warn(`Couldn't load custom interfaces`);
	}

	interfacesRaw.value = modules;

	interfacesRaw.value.forEach((inter: InterfaceConfig) => {
		registerComponent('interface-' + inter.id, inter.component);

		if (typeof inter.options !== 'function' && Array.isArray(inter.options) === false) {
			registerComponent(`interface-options-${inter.id}`, inter.options as Component);
		}
	});
}
