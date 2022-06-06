import { shallowRef, Ref } from 'vue';
import { OperationAppConfig } from '@directus/shared/types';

const operationsRaw: Ref<OperationAppConfig[]> = shallowRef([]);
const operations: Ref<OperationAppConfig[]> = shallowRef([]);

export function getOperations(): { operations: Ref<OperationAppConfig[]>; operationsRaw: Ref<OperationAppConfig[]> } {
	return { operations, operationsRaw };
}

export function getOperation(name?: string | null): OperationAppConfig | undefined {
	return !name ? undefined : operations.value.find(({ id }) => id === name);
}
