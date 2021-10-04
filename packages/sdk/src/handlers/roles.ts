/**
 * Roles handler
 */

import { ItemsHandler } from '@/src/base/items.js';
import { ITransport } from '@/src/transport.js';
import { RoleType, DefaultType } from '@/src/types.js';

export type RoleItem<T = DefaultType> = RoleType & T;

export class RolesHandler<T = DefaultType> extends ItemsHandler<RoleItem<T>> {
	constructor(transport: ITransport) {
		super('directus_roles', transport);
	}
}
