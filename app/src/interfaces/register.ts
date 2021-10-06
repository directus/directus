import { getRootPath } from '@/utils/get-root-path';
import { App } from 'vue';
import { getInterfaces } from './index';
import { InterfaceConfig } from '@directus/shared/types';

const { interfacesRaw } = getInterfaces();

export async function registerInterfaces(app: App): Promise<void> {
	const interfaceModules = import.meta.globEager('./*/**/index.ts');

	const interfaces: InterfaceConfig[] = Object.values(interfaceModules).map((module) => module.default);

	try {
		const customInterfaces: { default: InterfaceConfig[] } = import.meta.env.DEV
			? await import('@directus-extensions-interface')
			: await import(/* @vite-ignore */ `${getRootPath()}extensions/interfaces/index.js`);

		interfaces.push(...customInterfaces.default);
	} catch (err: any) {
		// eslint-disable-next-line no-console
		console.warn(`Couldn't load custom interfaces`);
		// eslint-disable-next-line no-console
		console.warn(err);
	}

	interfacesRaw.value = interfaces;

	interfacesRaw.value.forEach((inter: InterfaceConfig) => {
		app.component(`interface-${inter.id}`, inter.component);

		if (typeof inter.options !== 'function' && Array.isArray(inter.options) === false && inter.options !== null) {
			app.component(`interface-options-${inter.id}`, inter.options);
		}
	});
}
