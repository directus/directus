import { App } from 'vue';
import { getInterfaces } from './index';
import { InterfaceConfig } from '@directus/shared/types';
import { getExtensions } from '@/extensions';

const { interfacesRaw } = getInterfaces();

export function registerInterfaces(app: App): void {
	const interfaceModules = import.meta.globEager('./*/**/index.ts');

	const interfaces: InterfaceConfig[] = Object.values(interfaceModules).map((module) => module.default);

	const customInterfaces = getExtensions('interface');
	interfaces.push(...customInterfaces);

	interfacesRaw.value = interfaces;

	interfacesRaw.value.forEach((inter: InterfaceConfig) => {
		app.component(`interface-${inter.id}`, inter.component);

		if (typeof inter.options !== 'function' && Array.isArray(inter.options) === false && inter.options !== null) {
			app.component(`interface-options-${inter.id}`, inter.options);
		}
	});
}
