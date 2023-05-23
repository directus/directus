import {
	RequestConfig,
	TransportErrorDescription,
	TransportMethods,
	TransportOptions,
	TransportRequestOptions,
	TransportResponse,
} from './types';

export class Transport {
	constructor(private config: TransportOptions) {
		if (this.config?.beforeRequest) {
			this.beforeRequest = this.config.beforeRequest;
		}
	}

	async beforeRequest(config: RequestConfig): Promise<RequestConfig> {
		return config;
	}

	get url(): string {
		return this.config.url;
	}

	private serializeParams(params: Record<string, any>) {
		// TODO serialize params better
		const result = Object.fromEntries(
			Object.entries(params).map((item) => {
				if (typeof item[1] === 'object' && !Array.isArray(item[1])) {
					return [item[0], JSON.stringify(item[1])];
				}

				return item;
			})
		);

		return new URLSearchParams(result).toString();
	}

	protected async request<T = any, R = any>(
		method: TransportMethods,
		path: string,
		data?: any,
		options?: TransportRequestOptions
	): Promise<TransportResponse<T, R>> {
		try {
			let config: RequestConfig = {
				method,
				url: new URL(path, this.config.url),
				params: options?.params,
				headers: options?.headers ?? {},
				responseType: options?.responseType,
			};

			config = await this.beforeRequest(config);

			if (config.params) {
				config.url =
					(typeof config.url === 'string' ? config.url : config.url.toString()) +
					(config.params ? '?' + this.serializeParams(config.params) : '');
			}

			const response = await fetch(config.url, {
				method: config.method,
				body: data ? JSON.stringify(data) : null,
				credentials: config?.credentials,
				headers: {
					'Content-Type': 'application/json',
					...config.headers,
				},
			});

			const responseText = await response.text();
			let isJsonResponse = true;
			let result: any = responseText;

			try {
				result = JSON.parse(responseText);
			} catch (e) {
				isJsonResponse = false;
			}

			if (response.status >= 400) {
				throw new TransportError<T, R>(null, {
					raw: result,
					status: response.status,
					statusText: response.statusText,
					headers: response.headers,
					data: isJsonResponse ? result.data : undefined,
					meta: isJsonResponse ? result.meta : undefined,
					errors: isJsonResponse ? result.errors : undefined,
				});
			}

			if (!isJsonResponse) {
				return {
					raw: result,
					status: response.status,
					statusText: response.statusText,
					headers: response.headers,
				};
			}

			const content = {
				raw: result,
				status: response.status,
				statusText: response.statusText,
				headers: response.headers,
				data: result.data,
				meta: result.meta,
				errors: result.errors,
			};

			if (result.errors && result.errors.length > 0) {
				throw new TransportError<T, R>(null, content);
			}

			return content;
		} catch (err: any) {
			if (!err || err instanceof Error === false) {
				throw err;
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
