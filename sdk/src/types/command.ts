import type { DirectusClient } from '../client.js';
import type { RESTRequestOptions } from '../composables/rest.js';

export interface Command<
	_Input extends object,
	Output extends object | unknown,
	Client extends DirectusClient,
	_Schema extends object
> {
	(client: Client): Promise<Output>;
}

export type RESTCommand<
	_Schema extends object,
	_Options extends object,
	_Output extends object | unknown
> = RESTRequestOptions;

export type ApiError = {
	message: string;
	status?: number;
	code?: string;
	extensions?: Record<string, any>;
};

export type ApiResponse<Data = any> = { data: Data }; // | { errors: ApiError[] };
