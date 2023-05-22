/**
 * Roles handler
 */

import { ItemsHandler } from '../items';
import { Transport } from '../transport';
import { DefaultType, RoleType } from '../types';

export type RoleItem<T = DefaultType> = RoleType & T;

export class RolesHandler<T = DefaultType> extends ItemsHandler<RoleItem<T>> {
	constructor(transport: Transport) {
		super('directus_roles', transport);
	}
}
