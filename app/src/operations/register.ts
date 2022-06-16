import { getRootPath } from '@/utils/get-root-path';
import { App } from 'vue';
import { getOperations } from './index';
import { OperationAppConfig } from '@directus/shared/types';

const { operationsRaw } = getOperations();

export async function registerOperations(app: App): Promise<void> {
	const operationModules = import.meta.globEager('./*/**/index.ts');

	const operations: OperationAppConfig[] = Object.values(operationModules).map((module) => module.default);

	try {
		const customOperations: { default: OperationAppConfig[] } = import.meta.env.DEV
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

	operationsRaw.value.forEach((operation: OperationAppConfig) => {
		if (
			typeof operation.overview !== 'function' &&
			Array.isArray(operation.overview) === false &&
			operation.overview !== null
		) {
			app.component(`operation-overview-${operation.id}`, operation.overview);
		}

		if (
			typeof operation.options !== 'function' &&
			Array.isArray(operation.options) === false &&
			operation.options !== null
		) {
			app.component(`operation-options-${operation.id}`, operation.options);
		}
	});
}
