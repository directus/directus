import type { AbstractServiceOptions } from '../types/index.js';
import { ItemsService } from '../services/items.js';
import type { DatabaseExtension } from '@directus/types';

export class ExtensionsService extends ItemsService<DatabaseExtension> {
	constructor(options: AbstractServiceOptions) {
		super('directus_extensions', options);
	}
}
