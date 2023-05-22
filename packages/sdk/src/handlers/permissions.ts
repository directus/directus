/**
 * Permissions handler
 */

import { ItemsHandler } from '../base/items';
import { Transport } from '../transport';
import { PermissionType, DefaultType } from '../types';

export type PermissionItem<T = DefaultType> = PermissionType & T;

export class PermissionsHandler<T = DefaultType> extends ItemsHandler<PermissionItem<T>> {
	constructor(transport: Transport) {
		super('directus_permissions', transport);
	}
}
