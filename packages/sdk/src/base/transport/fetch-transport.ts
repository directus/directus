import { IStorage } from '../../storage.js';
import {
	ITransport,
	TransportMethods,
	TransportResponse,
	TransportError,
	TransportOptions,
	TransportRefreshHandler,
} from '../../transport.js';
import { QS } from '../../utils/querystring.js';

export class FetchTransport implements ITransport {
	private _url: string;
	private _storage: IStorage;
	private _refresh: () => Promise<void>;
	private _fetch?: typeof fetch;

	constructor(url: string, storage: IStorage, refresh: TransportRefreshHandler = () => Promise.resolve()) {
		this._url = url;
		this._storage = storage;
		this._refresh = refresh;
		this.url = url;
	}

	get url(): string {
		return this._url;
	}

	set url(value: string) {
		this._url = value;
	}

	async setupPlatformFetch() {
		// Webpack is not prepared to handle some ES2020 features. Although we don't use it, many clients are: create-react-app, @angular/cli, etc.
		// In order to prevent it to build dynamic imports, we need to use a variable on the import.
		const nodeFetch = 'node-fetch';

		this._fetch =
			typeof window === 'undefined' ? ((await import(nodeFetch)).default as typeof fetch) : window.fetch.bind(window);
	}

	async request<T = any, R = any>(
		method: TransportMethods,
		path: string,
		data?: Record<string, any>,
		options?: TransportOptions
	): Promise<TransportResponse<T, R>> {
		if (!this._fetch) await this.setupPlatformFetch();

		try {
			options = options || {};
			options.sendAuthorizationHeaders = options.sendAuthorizationHeaders ?? true;
			options.refreshTokenIfNeeded = options.refreshTokenIfNeeded ?? true;
			options.headers = options.headers ?? {};

			if (options.refreshTokenIfNeeded) {
				await this._refresh();
			}

			const url = new URL(`${this._url}${path}`);

			if (options.params) url.search = QS.stringify(options.params);

			const config: RequestInit = {
				method,
				credentials: 'include',
				headers: options.headers,
			};

			if (data) {
				config.body = JSON.stringify(data);
				config.headers = { ...config.headers, 'Content-Type': 'application/json' };
			}

			const token = this._storage.auth_token;
			const expiration = this._storage.auth_expires;
			if (options.sendAuthorizationHeaders) {
				if (token && ((expiration !== null && expiration > Date.now()) || expiration === null)) {
					if (token.startsWith(`Bearer `)) {
						config.headers = { ...config.headers, Authorization: token };
					} else {
						config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
					}
				}
			}

			const response = await this._fetch!(url.toString(), config);

			const text = await response.text();
			const json = response.headers.get('content-type')?.startsWith('application/json') ? JSON.parse(text) : text;

			const content = {
				raw: json,
				status: response.status,
				statusText: response.statusText,
				headers: response.headers,
				data: json?.data,
				meta: json?.meta,
				errors: json?.errors,
			};

			switch (true) {
				case !(response.status >= 200 && response.status < 300):
				case json.errors:
					throw new TransportError<T>(null, content);
			}

			return content;
		} catch (err: any) {
			if (!err || err instanceof Error === false || err instanceof TransportError) {
				throw err;
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
