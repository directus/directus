import { IStorage } from '@/src/storage.js';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ITransport, TransportMethods, TransportResponse, TransportError, TransportOptions } from '@/src/transport.js';

export type AxiosTransportRefreshHandler = () => Promise<void>;

export type AxiosEjector = {
	eject(): void;
};

export type AxiosInterceptorFunction<T> = (
	onFulfilled?: (value: T) => T | Promise<T>,
	onRejected?: (error: any) => any
) => AxiosEjector;

export type AxiosInterceptor<T> = {
	intercept: AxiosInterceptorFunction<T>;
};

/**
 * Axios transport implementation
 */
export class AxiosTransport implements ITransport {
	private _url: string;
	private _storage: IStorage;
	private _refresh: () => Promise<void>;
	public _axios: AxiosInstance;

	constructor(url: string, storage: IStorage, refresh: AxiosTransportRefreshHandler = () => Promise.resolve()) {
		this._url = url;
		this._storage = storage;
		this._axios = null as any;
		this._refresh = refresh;
		this.url = url;
	}

	get url(): string {
		return this._url;
	}

	set url(value: string) {
		this._url = value;
		this._axios = axios.create({
			baseURL: value,
			withCredentials: true,
		});
	}

	get axios(): AxiosInstance {
		return this._axios;
	}

	get requests(): AxiosInterceptor<AxiosRequestConfig> {
		return {
			intercept: (onFulfilled, onRejected) => {
				const id = this._axios.interceptors.request.use(onFulfilled, onRejected);
				return {
					eject: () => {
						this._axios.interceptors.request.eject(id);
					},
				};
			},
		};
	}

	get responses(): AxiosInterceptor<AxiosResponse> {
		return {
			intercept: (onFulfilled, onRejected) => {
				const id = this._axios.interceptors.response.use(onFulfilled, onRejected);
				return {
					eject: () => {
						this._axios.interceptors.response.eject(id);
					},
				};
			},
		};
	}

	protected async request<T = any, R = any>(
		method: TransportMethods,
		path: string,
		data?: Record<string, any>,
		options?: TransportOptions
	): Promise<TransportResponse<T, R>> {
		try {
			options = options || {};
			options.sendAuthorizationHeaders = options.sendAuthorizationHeaders ?? true;
			options.refreshTokenIfNeeded = options.refreshTokenIfNeeded ?? true;
			options.headers = options.headers ?? {};
			options.onUploadProgress = options.onUploadProgress ?? undefined;

			if (options.refreshTokenIfNeeded) {
				await this._refresh();
			}

			const config = {
				method,
				url: path,
				data: data,
				params: options.params,
				headers: options.headers,
				onUploadProgress: options.onUploadProgress,
			};

			const token = this._storage.auth_token;
			const expiration = this._storage.auth_expires;
			if (options.sendAuthorizationHeaders) {
				if (token && ((expiration !== null && expiration > Date.now()) || expiration === null)) {
					if (token.startsWith(`Bearer `)) {
						config.headers.Authorization = token;
					} else {
						config.headers.Authorization = `Bearer ${token}`;
					}
				}
			}

			const response = await this.axios.request<any>(config);

			const responseData = response.data;
			const content = {
				raw: response.data as any,
				status: response.status,
				statusText: response.statusText,
				headers: response.headers,
				data: responseData.data,
				meta: responseData.meta,
				errors: responseData.errors,
			};

			if (responseData.errors) {
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
