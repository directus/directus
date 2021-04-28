import { App, Component } from 'vue';
import registerComponent from '@/utils/register-component/';
import { getInterfaces } from './index';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { InterfaceConfig } from './types';
// @TODO3 tiny-async-pool relies on node.js global variables
import asyncPool from 'tiny-async-pool/lib/es7.js';

const { interfacesRaw } = getInterfaces();

export async function registerInterfaces(app: App) {
	const interfaceModules = import.meta.globEager('./*/**/index.ts');

	const interfaces: InterfaceConfig[] = Object.values(interfaceModules).map((module) => module.default);

	try {
		const customResponse = await api.get('/extensions/interfaces/');
		const customInterfaces: string[] = customResponse.data.data || [];

		await asyncPool(5, customInterfaces, async (interfaceName) => {
			try {
				const result = await import(
					/* @vite-ignore */ `${getRootPath()}extensions/interfaces/${interfaceName}/index.js`
				);
				interfaces.push(result.default);
			} catch (err) {
				console.warn(`Couldn't load custom interface "${interfaceName}":`, err);
			}
		});
	} catch {
		console.warn(`Couldn't load custom interfaces`);
	}

	interfacesRaw.value = interfaces;

	interfacesRaw.value.forEach((inter) => {
		registerComponent('interface-' + inter.id, inter.component);

		if (typeof inter.options !== 'function' && Array.isArray(inter.options) === false) {
			registerComponent(`interface-options-${inter.id}`, inter.options as Component);
		}
	});
}
