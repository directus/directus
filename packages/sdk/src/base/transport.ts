import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { ITransport, TransportMethods, TransportResponse, TransportError, TransportOptions } from '../transport';

/**
 * Transport implementation
 */
export class Transport extends ITransport {
	private axios: AxiosInstance;
	private config: TransportOptions;

	constructor(config: TransportOptions) {
		super();

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

	async get<T = any>(path: string, options?: TransportOptions): Promise<TransportResponse<T>> {
		return await this.request('get', path, undefined, options);
	}

	async head<T = any>(path: string, options?: TransportOptions): Promise<TransportResponse<T>> {
		return await this.request('head', path, undefined, options);
	}

	async options<T = any>(path: string, options?: TransportOptions): Promise<TransportResponse<T>> {
		return await this.request('options', path, undefined, options);
	}

	async delete<T = any, D = any>(path: string, data?: D, options?: TransportOptions): Promise<TransportResponse<T>> {
		return await this.request('delete', path, data, options);
	}

	async put<T = any, D = any>(path: string, data?: D, options?: TransportOptions): Promise<TransportResponse<T>> {
		return await this.request('put', path, data, options);
	}

	async post<T = any, D = any>(path: string, data?: D, options?: TransportOptions): Promise<TransportResponse<T>> {
		return await this.request('post', path, data, options);
	}

	async patch<T = any, D = any>(path: string, data?: D, options?: TransportOptions): Promise<TransportResponse<T>> {
		return await this.request('patch', path, data, options);
	}
}
