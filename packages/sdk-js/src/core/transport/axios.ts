import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ITransport, TransportResponse } from '../../shared/transport';

/**
 * Axios transport implementation
 */
export class AxiosTransport implements ITransport {
	// change to callbacks

	private _token: string | null;

	get token(): string | null {
		return this._token;
	}

	set token(value: string | null) {
		this._token = value;
	}

	// end change to callbacks

	public axios: AxiosInstance;

	constructor(url: string) {
		this._token = null;
		this.axios = axios.create({
			baseURL: url,
		});
		this.axios.interceptors.request.use(this.createRequestConfig.bind(this));
	}

	async get<T = any>(path: string, options?: any): Promise<TransportResponse<T>> {
		const response = await this.axios.get(path, options);
		return response;
	}

	async post<T = any>(path: string, options?: any): Promise<TransportResponse<T>> {
		const response = await this.axios.post(path, options);
		return response.data;
	}

	async patch<T = any>(path: string, options?: any): Promise<TransportResponse<T>> {
		const response = await this.axios.patch(path, options);
		return response.data;
	}

	async delete<T = any>(path: string, options?: any): Promise<TransportResponse<T>> {
		const response = await this.axios.delete(path, options);
		return response.data;
	}

	async head<T = any>(path: string, options?: any): Promise<TransportResponse<T>> {
		const response = await this.axios.head(path, options);
		return response.data;
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
