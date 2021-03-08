import { Item, ItemMetadata } from './items';

export type TransportErrorDescription = {
	message?: string;
	extensions?: Record<string, any> & {
		code?: string;
	};
};

export type TransportResponse<T extends Item> = {
	data?: T | T[];
	meta?: ItemMetadata;
	errors?: TransportErrorDescription[];
	status: number;
	statusText?: string;
	headers: any;
};

export type TransportMethods = 'get' | 'delete' | 'head' | 'options' | 'post' | 'put' | 'patch';

export interface ITransport {
	token: string | null | undefined;
	get<T = any>(path: string): Promise<TransportResponse<T>>;
	delete<T = any>(path: string): Promise<TransportResponse<T>>;
	head<T = any>(path: string): Promise<TransportResponse<T>>;
	options<T = any>(path: string): Promise<TransportResponse<T>>;
	post<T = any, P = any>(path: string, data?: P): Promise<TransportResponse<T>>;
	put<T = any, P = any>(path: string, data?: P): Promise<TransportResponse<T>>;
	patch<T = any, P = any>(path: string, data?: P): Promise<TransportResponse<T>>;
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
