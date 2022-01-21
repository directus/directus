import { Accountability } from './accountability';
import { ApiExtensionContext } from './extensions';

type OperationContext = ApiExtensionContext & {
	data: Record<string, unknown>;
	accountability: Accountability | null;
};

export type OperationHandler = (
	options: Record<string, unknown>,
	context: OperationContext
) => unknown | Promise<unknown> | void;

export interface OperationAppConfig {
	id: string;
	name: string;
	icon: string;

	options: Record<string, unknown>;
}

export interface OperationApiConfig {
	id: string;

	handler: OperationHandler;
}
