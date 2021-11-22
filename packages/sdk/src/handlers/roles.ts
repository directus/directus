/**
 * Roles handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { RoleType, DefaultType } from '../types';

export type RoleItem<T = DefaultType> = RoleType & T;

export class RolesHandler<T = DefaultType> extends ItemsHandler<RoleItem<T>> {
	constructor(transport: ITransport) {
		super('directus_roles', transport);
	}
}
