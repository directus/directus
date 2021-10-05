/**
 * Permissions handler
 */

import { ItemsHandler } from '../base/items.js';
import { ITransport } from '../transport.js';
import { PermissionType, DefaultType } from '../types.js';

export type PermissionItem<T = DefaultType> = PermissionType & T;

export class PermissionsHandler<T = DefaultType> extends ItemsHandler<PermissionItem<T>> {
	constructor(transport: ITransport) {
		super('directus_permissions', transport);
	}
}
