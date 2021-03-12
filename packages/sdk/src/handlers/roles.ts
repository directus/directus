/**
 * Roles handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { RoleType } from '../types';

export type RoleItem<T extends object = {}> = RoleType & T;

export class RolesHandler<T extends object> extends ItemsHandler<RoleItem<T>> {
	constructor(transport: ITransport) {
		super('directus_roles', transport);
	}
}
