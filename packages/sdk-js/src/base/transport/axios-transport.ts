import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ITransport, TransportMethods, TransportResponse, TransportError } from '../../transport';

/**
 * Axios transport implementation
 */
export class AxiosTransport implements ITransport {
	// change to callbacks

	private _token?: string | null;

	get token(): string | null | undefined {
		return this._token;
	}

	set token(value: string | null | undefined) {
		this._token = value;
	}

	// end change to callbacks

	public axios: AxiosInstance;

	constructor(url: string, token: string | null = null) {
		this._token = token;
		this.axios = axios.create({
			baseURL: url,
		});
		this.axios.interceptors.request.use(this.createRequestConfig.bind(this));
	}

	private async request<T = any>(method: 'get', path: string): Promise<TransportResponse<T>>;
	private async request<T = any>(method: 'delete', path: string): Promise<TransportResponse<T>>;
	private async request<T = any>(method: 'head', path: string): Promise<TransportResponse<T>>;
	private async request<T = any>(method: 'options', path: string): Promise<TransportResponse<T>>;
	private async request<T = any, D = any>(method: 'post', path: string, data?: D): Promise<TransportResponse<T>>;
	private async request<T = any, D = any>(method: 'put', path: string, data?: D): Promise<TransportResponse<T>>;
	private async request<T = any, D = any>(method: 'patch', path: string, data?: D): Promise<TransportResponse<T>>;
	private async request<M extends TransportMethods, T = any>(
		method: M,
		path: string,
		...args: any
	): Promise<TransportResponse<T>> {
		try {
			const make = this.axios[method] as AxiosInstance[M];
			const response = await make<TransportResponse<T>>(path, ...args);
			const { data, meta, errors } = response.data;
			return {
				status: response.status,
				statusText: response.statusText,
				headers: response.headers,
				data,
				meta,
				errors,
			};
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const data = err.response?.data;
				throw new TransportError<T>(err, {
					status: err.response?.status,
					headers: err.response?.headers,
					data: data?.data,
					meta: data?.meta,
					errors: data?.errors,
				});
			}
			throw new TransportError<T>(err);
		}
	}

	async get<T = any>(path: string): Promise<TransportResponse<T>> {
		return await this.request('get', path);
	}

	async delete<T = any>(path: string): Promise<TransportResponse<T>> {
		return await this.request('delete', path);
	}

	async head<T = any>(path: string): Promise<TransportResponse<T>> {
		return await this.request('head', path);
	}

	async options<T = any>(path: string): Promise<TransportResponse<T>> {
		return await this.request('options', path);
	}

	async put<T = any, D = any>(path: string, data?: D): Promise<TransportResponse<T>> {
		return await this.request('put', path, data);
	}

	async post<T = any, D = any>(path: string, data?: D): Promise<TransportResponse<T>> {
		return await this.request('post', path, data);
	}

	async patch<T = any, D = any>(path: string, data?: D): Promise<TransportResponse<T>> {
		return await this.request('patch', path, data);
	}

	private createRequestConfig(config: AxiosRequestConfig): AxiosRequestConfig {
		let token = this._token;
		if (!token) {
			return config;
		}

		if (token.startsWith(`Bearer `)) {
			config.headers.Authorization = token;
		} else {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	}
}
