/**
 * Settings handler
 */

import { Transport, TransportRequestOptions, TransportResponse } from '../transport';

export class ExtensionEndpoint {
	private name: string;
	private transport: Transport;

	constructor(transport: Transport, name: string) {
		this.name = name;
		this.transport = transport;
	}

	private endpoint(path: string) {
		if (path.startsWith('/')) {
			path = path.substr(1);
		}

		return `/custom/${this.name}/${path}`;
	}

	get<T = any>(path: string, options?: TransportRequestOptions): Promise<TransportResponse<T>> {
		return this.transport.get(this.endpoint(path), options);
	}

	head<T = any>(path: string, options?: TransportRequestOptions): Promise<TransportResponse<T>> {
		return this.transport.head(this.endpoint(path), options);
	}

	options<T = any>(path: string, options?: TransportRequestOptions): Promise<TransportResponse<T>> {
		return this.transport.options(this.endpoint(path), options);
	}

	delete<T = any, P = any>(path: string, data?: P, options?: TransportRequestOptions): Promise<TransportResponse<T>> {
		return this.transport.delete(this.endpoint(path), data, options);
	}

	post<T = any, P = any>(path: string, data?: P, options?: TransportRequestOptions): Promise<TransportResponse<T>> {
		return this.transport.post(this.endpoint(path), data, options);
	}

	put<T = any, P = any>(path: string, data?: P, options?: TransportRequestOptions): Promise<TransportResponse<T>> {
		return this.transport.put(this.endpoint(path), data, options);
	}

	patch<T = any, P = any>(path: string, data?: P, options?: TransportRequestOptions): Promise<TransportResponse<T>> {
		return this.transport.patch(this.endpoint(path), data, options);
	}
}

export class ExtensionHandler {
	private transport: Transport;

	constructor(transport: Transport) {
		this.transport = transport;
	}

	endpoint(name: string): ExtensionEndpoint {
		return new ExtensionEndpoint(this.transport, name);
	}
}
