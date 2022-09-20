import { App } from 'vue';
import { OperationAppConfig } from '@directus/shared/types';

export function getInternalOperations(): OperationAppConfig[] {
	const operations = import.meta.globEager('./*/index.ts');

	return Object.values(operations).map((module) => module.default);
}

export function registerOperations(operations: OperationAppConfig[], app: App): void {
	for (const operation of operations) {
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
	}
}
