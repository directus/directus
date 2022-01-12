export type OperationHandler = (
	data: Record<string, any>,
	options: Record<string, any>
) => Record<string, any> | void | Promise<Record<string, any>> | Promise<void>;

export interface OperationAppConfig {
	id: string;
	name: string;

	options: Record<string, any>;
}

export interface OperationApiConfig {
	id: string;

	handler: OperationHandler;
}
