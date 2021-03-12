/**
 * Permissions handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { PermissionType } from '../types';

export type PermissionItem<T extends object = {}> = PermissionType & T;

export class PermissionsHandler<T extends object> extends ItemsHandler<PermissionItem<T>> {
	constructor(transport: ITransport) {
		super('directus_permissions', transport);
	}
}
