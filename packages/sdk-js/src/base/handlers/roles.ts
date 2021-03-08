/**
 * Roles handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';

export type Roles<T extends object = DefaultFields> = {
	// Roles Fields
} & T;

export class RolesHandler<T extends object> extends ItemsHandler<Roles<T>> {
	constructor(transport: ITransport) {
		super('directus_roles', transport);
	}
}
