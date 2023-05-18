import { AxiosRequestConfig, ResponseType } from 'axios';
import { ItemMetadata } from './items';

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

export type TransportRequestOptions = {
	params?: any;
	headers?: any;
	responseType?: ResponseType;
	onUploadProgress?: ((progressEvent: any) => void) | undefined;
	maxBodyLength?: number;
	maxContentLength?: number;
};

export type TransportOptions = TransportRequestOptions & {
	url: string;
	beforeRequest?: (config: AxiosRequestConfig) => Promise<AxiosRequestConfig>;
};

export abstract class ITransport {
	abstract get<T = any, R = any>(path: string, options?: TransportRequestOptions): Promise<TransportResponse<T, R>>;
	abstract head<T = any, R = any>(path: string, options?: TransportRequestOptions): Promise<TransportResponse<T, R>>;
	abstract options<T = any, R = any>(path: string, options?: TransportRequestOptions): Promise<TransportResponse<T, R>>;
	abstract delete<T = any, P = any, R = any>(
		path: string,
		data?: P,
		options?: TransportRequestOptions
	): Promise<TransportResponse<T, R>>;

	abstract post<T = any, P = any, R = any>(
		path: string,
		data?: P,
		options?: TransportRequestOptions
	): Promise<TransportResponse<T, R>>;

	abstract put<T = any, P = any, R = any>(
		path: string,
		data?: P,
		options?: TransportRequestOptions
	): Promise<TransportResponse<T, R>>;

	abstract patch<T = any, P = any, R = any>(
		path: string,
		data?: P,
		options?: TransportRequestOptions
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
