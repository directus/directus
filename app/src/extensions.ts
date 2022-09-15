import { AppExtensionType, HybridExtensionType } from '@directus/shared/types';
import { pluralize } from '@directus/shared/utils';
import { getRootPath } from './utils/get-root-path';

let extensions: Record<string, any> = {};

export async function loadExtensions() {
	try {
		extensions = import.meta.env.DEV
			? await import('@directus-extensions')
			: await import(/* @vite-ignore */ `${getRootPath()}extensions/sources/index.js`);
	} catch (err: any) {
		// eslint-disable-next-line no-console
		console.warn(`Couldn't load extensions`);
		// eslint-disable-next-line no-console
		console.warn(err);
	}
}

export function getExtensions(type: AppExtensionType | HybridExtensionType) {
	return extensions[pluralize(type)];
}
