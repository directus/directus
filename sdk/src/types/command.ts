export interface Command<Output extends object | unknown, Configuration extends object, _Schema extends object> {
	(configuration: Configuration): Promise<Output>;
}

export type ApiError = {
	message: string;
	status?: number;
	code?: string;
	extensions?: Record<string, any>;
};
export type ApiResponse<Data = any> = { data: Data } | { errors: ApiError[] };
