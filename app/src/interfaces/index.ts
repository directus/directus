import { App } from 'vue';
import { InterfaceConfig } from '@directus/shared/types';

export function getInternalInterfaces(): InterfaceConfig[] {
	const interfaces = import.meta.globEager('./*/index.ts');
	const interfacesSystem = import.meta.globEager('./_system/*/index.ts');

	return [
		...Object.values(interfaces).map((module) => module.default),
		...Object.values(interfacesSystem).map((module) => module.default),
	];
}

export function registerInterfaces(interfaces: InterfaceConfig[], app: App): void {
	for (const inter of interfaces) {
		app.component(`interface-${inter.id}`, inter.component);

		if (typeof inter.options !== 'function' && Array.isArray(inter.options) === false && inter.options !== null) {
			app.component(`interface-options-${inter.id}`, inter.options);
		}
	}
}
