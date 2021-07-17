import { getRootPath } from '@/utils/get-root-path';
import { App } from 'vue';
import { getInterfaces } from './index';
import { InterfaceConfig } from './types';

const { interfacesRaw } = getInterfaces();

export async function registerInterfaces(app: App): Promise<void> {
	const interfaceModules = import.meta.globEager('./*/**/index.ts');

	const interfaces: InterfaceConfig[] = Object.values(interfaceModules).map((module) => module.default);

	try {
		if (import.meta.env.DEV) {
			const customInterfaceModules = import.meta.globEager('../../../api/extensions/interfaces/*/index.js');
			const customInterfaces: InterfaceConfig[] = Object.values(customInterfaceModules).map((module) => module.default);
			interfaces.push(...customInterfaces);
		} else {
			const customInterfaces: { default: InterfaceConfig[] } = await import(
				/* @vite-ignore */ `${getRootPath()}extensions/interfaces/index.js`
			);
			interfaces.push(...customInterfaces.default);
		}
	} catch {
		// eslint-disable-next-line no-console
		console.warn(`Couldn't load custom interfaces`);
	}

	interfacesRaw.value = interfaces;

	interfacesRaw.value.forEach((inter: InterfaceConfig) => {
		app.component('interface-' + inter.id, inter.component);

		if (typeof inter.options !== 'function' && Array.isArray(inter.options) === false) {
			app.component(`interface-options-${inter.id}`, inter.options);
		}
	});
}
