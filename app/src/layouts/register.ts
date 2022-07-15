import { getRootPath } from '@/utils/get-root-path';
import { App } from 'vue';
import { getLayouts } from './index';
import { LayoutConfig } from '@directus/shared/types';
import { getExternalLayouts } from '@/utils/external-extensions';

const { layoutsRaw } = getLayouts();

export async function registerLayouts(app: App): Promise<void> {
	const layoutModules = import.meta.globEager('./*/**/index.ts');

	const layouts: LayoutConfig[] = Object.values(layoutModules).map((module) => module.default);

	try {
		const customLayouts: { default: LayoutConfig[] } = import.meta.env.DEV
			? await import('@directus-extensions-layout')
			: await import(/* @vite-ignore */ `${getRootPath()}extensions/layouts/index.js`);

		const externalLayouts = await getExternalLayouts();
		const allLayouts = [...customLayouts.default, ...externalLayouts];

		layouts.push(...allLayouts);
	} catch (err: any) {
		// eslint-disable-next-line no-console
		console.warn(`Couldn't load custom layouts`);
		// eslint-disable-next-line no-console
		console.warn(err);
	}

	layoutsRaw.value = layouts;

	layoutsRaw.value.forEach((layout) => {
		if (!Object.prototype.isPrototypeOf.call(HTMLElement, layout.component))
			app.component(`layout-${layout.id}`, layout.component);
		if (!Object.prototype.isPrototypeOf.call(HTMLElement, layout.slots.options))
			app.component(`layout-options-${layout.id}`, layout.slots.options);
		if (!Object.prototype.isPrototypeOf.call(HTMLElement, layout.slots.sidebar))
			app.component(`layout-sidebar-${layout.id}`, layout.slots.sidebar);
		if (!Object.prototype.isPrototypeOf.call(HTMLElement, layout.slots.actions))
			app.component(`layout-actions-${layout.id}`, layout.slots.actions);
	});
}
