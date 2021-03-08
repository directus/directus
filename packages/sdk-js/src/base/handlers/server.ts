/**
 * Server handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';

export type Server<T extends object = DefaultFields> = {
	// Server Fields
} & T;

export class ServerHandler<T extends object> extends ItemsHandler<Server<T>> {
	constructor(transport: ITransport) {
		super('directus_server', transport);
	}
}
