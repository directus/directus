/**
 * Server handler
 */

import { ITransport } from '../transport';

export class ServerHandler {
	// @ts-ignore
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}
}
