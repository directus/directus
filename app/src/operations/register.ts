import { App } from 'vue';
import { getOperations } from './index';
import { OperationAppConfig } from '@directus/shared/types';
import { getExtensions } from '@/extensions';

const { operationsRaw } = getOperations();

export function registerOperations(app: App): void {
	const operationModules = import.meta.globEager('./*/**/index.ts');

	const operations: OperationAppConfig[] = Object.values(operationModules).map((module) => module.default);

	const customOperations = getExtensions('operation');
	operations.push(...customOperations);

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
