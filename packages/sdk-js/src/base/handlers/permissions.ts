/**
 * Permissions handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';

export type Permissions<T extends object = DefaultFields> = {
	// Permissions Fields
} & T;

export class PermissionsHandler<T extends object> extends ItemsHandler<Permissions<T>> {
	constructor(transport: ITransport) {
		super('directus_permissions', transport);
	}
}
