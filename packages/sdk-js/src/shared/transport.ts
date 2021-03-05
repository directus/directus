export type ErrorDescription = {
	message?: string;
	extensions?: Record<string, any> & {
		code?: string;
	};
};

export type Metadata = {
	total_count?: number;
	filter_count?: number;
};

export type Response<T = any> = {
	data?: T;
	meta?: Metadata;
	errors?: ErrorDescription[];
	status: number;
	statusText?: string;
	headers: any;
};

export type Methods = 'get' | 'delete' | 'head' | 'options' | 'post' | 'put' | 'patch';

export interface ITransport {
	token: string | null | undefined;
	get<T = any>(path: string): Promise<Response<T>>;
	delete<T = any>(path: string): Promise<Response<T>>;
	head<T = any>(path: string): Promise<Response<T>>;
	options<T = any>(path: string): Promise<Response<T>>;
	post<T = any, P = any>(path: string, data?: P): Promise<Response<T>>;
	put<T = any, P = any>(path: string, data?: P): Promise<Response<T>>;
	patch<T = any, P = any>(path: string, data?: P): Promise<Response<T>>;
}

export class TransportError<T = any> extends Error {
	public readonly errors: ErrorDescription[];
	public readonly response?: Partial<Response<T>>;
	public readonly parent: Error | null;

	constructor(parent: Error | null, response?: Partial<Response<T>>) {
		if (response?.errors?.length) {
			super(response?.errors[0]?.message);
		} else {
			super(parent?.message || 'Unknown transport error');
		}

		this.parent = parent;
		this.response = response;
		this.errors = response?.errors || [];

		if (!Object.values(response || {}).some((value) => value !== undefined)) {
			this.response = undefined;
		}

		Object.setPrototypeOf(this, TransportError.prototype);
	}
}
