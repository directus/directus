import { getRootPath } from '@/utils/get-root-path';
import { App } from 'vue';
import { getOperations } from './index';
import { operationConfig } from '@directus/shared/types';

const { operationsRaw } = getOperations();

export async function registerOperations(app: App): Promise<void> {
	const operationModules = import.meta.globEager('./*/**/index.ts');

	const operations: operationConfig[] = Object.values(operationModules).map((module) => module.default);

	try {
		const customOperations: { default: operationConfig[] } = import.meta.env.DEV
			? await import('@directus-extensions-operation')
			: await import(/* @vite-ignore */ `${getRootPath()}extensions/operations/index.js`);

		operations.push(...customOperations.default);
	} catch (err: any) {
		// eslint-disable-next-line no-console
		console.warn(`Couldn't load custom operations`);
		// eslint-disable-next-line no-console
		console.warn(err);
	}

	operationsRaw.value = operations;

	operationsRaw.value.forEach((inter: operationConfig) => {
		if (typeof inter.preview !== 'function' && Array.isArray(inter.preview) === false && inter.preview !== null) {
			app.component(`operation-${inter.id}`, inter.preview);
		}

		if (typeof inter.options !== 'function' && Array.isArray(inter.options) === false && inter.options !== null) {
			app.component(`operation-options-${inter.id}`, inter.options);
		}
	});
}
