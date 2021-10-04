/**
 * Permissions handler
 */

import { ItemsHandler } from '@/src/base/items.js';
import { ITransport } from '@/src/transport.js';
import { PermissionType, DefaultType } from '@/src/types.js';

export type PermissionItem<T = DefaultType> = PermissionType & T;

export class PermissionsHandler<T = DefaultType> extends ItemsHandler<PermissionItem<T>> {
	constructor(transport: ITransport) {
		super('directus_permissions', transport);
	}
}
