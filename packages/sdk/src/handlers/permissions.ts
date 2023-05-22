/**
 * Permissions handler
 */

import { ItemsHandler } from '../items';
import { Transport } from '../transport';
import { DefaultType, PermissionType } from '../types';

export type PermissionItem<T = DefaultType> = PermissionType & T;

export class PermissionsHandler<T = DefaultType> extends ItemsHandler<PermissionItem<T>> {
	constructor(transport: Transport) {
		super('directus_permissions', transport);
	}
}
