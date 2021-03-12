import { ItemMetadata } from './items';

export type TransportErrorDescription = {
	message?: string;
	extensions?: Record<string, any> & {
		code?: string;
	};
};

export type TransportResponse<T> = {
	data?: T;
	meta?: ItemMetadata;
	errors?: TransportErrorDescription[];
	status: number;
	statusText?: string;
	headers: any;
};

export type TransportMethods = 'get' | 'delete' | 'head' | 'options' | 'post' | 'put' | 'patch';

export type TransportOptions = {
	params?: any;
};

export interface ITransport {
	get<T = any>(path: string, options?: TransportOptions): Promise<TransportResponse<T>>;
	head<T = any>(path: string, options?: TransportOptions): Promise<TransportResponse<T>>;
	options<T = any>(path: string, options?: TransportOptions): Promise<TransportResponse<T>>;
	delete<T = any, P = any>(path: string, data?: P, options?: TransportOptions): Promise<TransportResponse<T>>;
	post<T = any, P = any>(path: string, data?: P, options?: TransportOptions): Promise<TransportResponse<T>>;
	put<T = any, P = any>(path: string, data?: P, options?: TransportOptions): Promise<TransportResponse<T>>;
	patch<T = any, P = any>(path: string, data?: P, options?: TransportOptions): Promise<TransportResponse<T>>;
}

export class TransportError<T = any> extends Error {
	public readonly errors: TransportErrorDescription[];
	public readonly response?: Partial<TransportResponse<T>>;
	public readonly parent: Error | null;

	constructor(parent: Error | null, response?: Partial<TransportResponse<T>>) {
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
