/**
 * Permissions handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { PermissionType, DefaultType } from '../types';

export type PermissionItem<T = DefaultType> = PermissionType & T;

export class PermissionsHandler<T = DefaultType> extends ItemsHandler<PermissionItem<T>> {
	constructor(transport: ITransport) {
		super('directus_permissions', transport);
	}
}
