import { ItemMetadata } from './items.js';

export type TransportErrorDescription = {
	message?: string;
	extensions?: Record<string, any> & {
		code?: string;
	};
};

export type TransportResponse<T, R = any> = {
	raw: R;
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
	headers?: any;
	refreshTokenIfNeeded?: boolean;
	sendAuthorizationHeaders?: boolean;
	onUploadProgress?: ((progressEvent: any) => void) | undefined;
};

export interface ITransport {
	url: string;
	get<T = any, R = any>(path: string, options?: TransportOptions): Promise<TransportResponse<T, R>>;
	head<T = any, R = any>(path: string, options?: TransportOptions): Promise<TransportResponse<T, R>>;
	options<T = any, R = any>(path: string, options?: TransportOptions): Promise<TransportResponse<T, R>>;
	delete<T = any, P = any, R = any>(
		path: string,
		data?: P,
		options?: TransportOptions
	): Promise<TransportResponse<T, R>>;
	post<T = any, P = any, R = any>(path: string, data?: P, options?: TransportOptions): Promise<TransportResponse<T, R>>;
	put<T = any, P = any, R = any>(path: string, data?: P, options?: TransportOptions): Promise<TransportResponse<T, R>>;
	patch<T = any, P = any, R = any>(
		path: string,
		data?: P,
		options?: TransportOptions
	): Promise<TransportResponse<T, R>>;
}

export class TransportError<T = any, R = any> extends Error {
	public readonly errors: TransportErrorDescription[];
	public readonly response?: Partial<TransportResponse<T, R>>;
	public readonly parent: Error | null;

	constructor(parent: Error | null, response?: Partial<TransportResponse<T, R>>) {
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
