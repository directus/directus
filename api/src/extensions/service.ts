import type { AbstractServiceOptions } from '../types/index.js';
import { ItemsService } from '../services/items.js';
import type { DatabaseExtension, DatabaseExtensionPermission } from '@directus/types';


export class ExtensionsService extends ItemsService<DatabaseExtension> {
	constructor(options: AbstractServiceOptions) {
		super('directus_extensions', options);
	}
}

export class ExtensionPermissionsService extends ItemsService<DatabaseExtensionPermission> {
	constructor(options: AbstractServiceOptions) {
		super('directus_extension_permissions', options);
	}
}
