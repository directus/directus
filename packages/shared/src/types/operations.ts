import { Accountability } from './accountability';
import { ApiExtensionContext } from './extensions';

type OperationContext = ApiExtensionContext & {
	accountability: Accountability | null;
};

export type OperationHandler = (
	data: Record<string, unknown>,
	options: Record<string, any>,
	context: OperationContext
) => unknown | Promise<unknown> | void;

export interface OperationAppConfig {
	id: string;
	name: string;

	options: Record<string, any>;
}

export interface OperationApiConfig {
	id: string;

	handler: OperationHandler;
}
