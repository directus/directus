/**
 * Roles handler
 */

import { ItemsHandler } from '../base/items.js';
import { ITransport } from '../transport.js';
import { RoleType, DefaultType } from '../types.js';

export type RoleItem<T = DefaultType> = RoleType & T;

export class RolesHandler<T = DefaultType> extends ItemsHandler<RoleItem<T>> {
	constructor(transport: ITransport) {
		super('directus_roles', transport);
	}
}
