import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, ResponseType } from 'axios';
import { ItemMetadata } from './types';

export class Transport {
	private axios: AxiosInstance;
	private config: TransportOptions;

	constructor(config: TransportOptions) {
		this.config = config;

		this.axios = axios.create({
			baseURL: this.config.url,
			params: this.config.params,
			headers: this.config.headers,
			onUploadProgress: this.config.onUploadProgress,
			maxBodyLength: this.config.maxBodyLength,
			maxContentLength: this.config.maxContentLength,
			withCredentials: true,
		});

		if (this.config?.beforeRequest) this.beforeRequest = this.config.beforeRequest;
	}

	async beforeRequest(config: AxiosRequestConfig): Promise<AxiosRequestConfig> {
		return config;
	}

	get url(): string {
		return this.config.url;
	}

	protected async request<T = any, R = any>(
		method: TransportMethods,
		path: string,
		data?: any,
		options?: Omit<TransportOptions, 'url'>
	): Promise<TransportResponse<T, R>> {
		try {
			let config: AxiosRequestConfig = {
				method,
				url: path,
				data: data,
				params: options?.params,
				headers: options?.headers,
				responseType: options?.responseType,
				onUploadProgress: options?.onUploadProgress,
			};

			config = await this.beforeRequest(config);

			const response = await this.axios.request<any>(config);

			const content = {
				raw: response.data as any,
				status: response.status,
				statusText: response.statusText,
				headers: response.headers,
				data: response.data.data,
				meta: response.data.meta,
				errors: response.data.errors,
			};

			if (response.data.errors) {
				throw new TransportError<T, R>(null, content);
			}

			return content;
		} catch (err: any) {
			if (!err || err instanceof Error === false) {
				throw err;
			}

			if (axios.isAxiosError(err)) {
				const data = err.response?.data as any;

				throw new TransportError<T>(err as AxiosError, {
					raw: err.response?.data,
					status: err.response?.status,
					statusText: err.response?.statusText,
					headers: err.response?.headers,
					data: data?.data,
					meta: data?.meta,
					errors: data?.errors,
				});
			}

			throw new TransportError<T>(err as Error);
		}
	}

	async get<T = any>(path: string, options?: TransportRequestOptions): Promise<TransportResponse<T>> {
		return this.request('get', path, undefined, options);
	}

	async head<T = any>(path: string, options?: TransportRequestOptions): Promise<TransportResponse<T>> {
		return this.request('head', path, undefined, options);
	}

	async options<T = any>(path: string, options?: TransportRequestOptions): Promise<TransportResponse<T>> {
		return this.request('options', path, undefined, options);
	}

	async delete<T = any, D = any>(
		path: string,
		data?: D,
		options?: TransportRequestOptions
	): Promise<TransportResponse<T>> {
		return this.request('delete', path, data, options);
	}

	async put<T = any, D = any>(
		path: string,
		data?: D,
		options?: TransportRequestOptions
	): Promise<TransportResponse<T>> {
		return this.request('put', path, data, options);
	}

	async post<T = any, D = any>(
		path: string,
		data?: D,
		options?: TransportRequestOptions
	): Promise<TransportResponse<T>> {
		return this.request('post', path, data, options);
	}

	async patch<T = any, D = any>(
		path: string,
		data?: D,
		options?: TransportRequestOptions
	): Promise<TransportResponse<T>> {
		return this.request('patch', path, data, options);
	}
}

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

export type TransportMethods = 'get' | 'delete' | 'head' | 'options' | 'post' | 'put' | 'patch' | 'search';

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
