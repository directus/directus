/**
 * Settings handler
 */

import { ITransport, TransportOptions, TransportResponse } from '../transport';

export class ExtensionEndpoint implements ITransport {
	private name: string;
	private transport: ITransport;

	constructor(transport: ITransport, name: string) {
		this.name = name;
		this.transport = transport;
	}

	private endpoint(path: string) {
		if (path.startsWith('/')) {
			path = path.substr(1);
		}

		return `/custom/${this.name}/${path}`;
	}

	get<T = any>(path: string, options?: TransportOptions): Promise<TransportResponse<T>> {
		return this.transport.get(this.endpoint(path), options);
	}

	head<T = any>(path: string, options?: TransportOptions): Promise<TransportResponse<T>> {
		return this.transport.head(this.endpoint(path), options);
	}

	options<T = any>(path: string, options?: TransportOptions): Promise<TransportResponse<T>> {
		return this.transport.options(this.endpoint(path), options);
	}

	delete<T = any, P = any>(path: string, data?: P, options?: TransportOptions): Promise<TransportResponse<T>> {
		return this.transport.delete(this.endpoint(path), data, options);
	}

	post<T = any, P = any>(path: string, data?: P, options?: TransportOptions): Promise<TransportResponse<T>> {
		return this.transport.post(this.endpoint(path), data, options);
	}

	put<T = any, P = any>(path: string, data?: P, options?: TransportOptions): Promise<TransportResponse<T>> {
		return this.transport.put(this.endpoint(path), data, options);
	}

	patch<T = any, P = any>(path: string, data?: P, options?: TransportOptions): Promise<TransportResponse<T>> {
		return this.transport.patch(this.endpoint(path), data, options);
	}
}

export class ExtensionHandler {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	endpoint(name: string): ExtensionEndpoint {
		return new ExtensionEndpoint(this.transport, name);
	}
}
