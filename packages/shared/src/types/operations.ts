export type OperationHandler = (
	data: Record<string, unknown>,
	options: Record<string, any>
) => unknown | void | Promise<unknown> | Promise<void>;

export interface OperationAppConfig {
	id: string;
	name: string;

	options: Record<string, any>;
}

export interface OperationApiConfig {
	id: string;

	handler: OperationHandler;
}
