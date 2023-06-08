import type { DirectusClient } from '../client.js';

export interface Command<
	_Input extends object,
	Output extends object | unknown,
	Client extends DirectusClient,
	_Schema extends object
> {
	(client: Client): Promise<Output>;
}

export type ApiError = {
	message: string;
	status?: number;
	code?: string;
	extensions?: Record<string, any>;
};

export type ApiResponse<Data = any> = { data: Data }; // | { errors: ApiError[] };
