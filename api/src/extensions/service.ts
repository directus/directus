import type { ExtensionRaw } from '@directus/types';
import type { AbstractServiceOptions } from '../types/index.js';
import { ItemsService } from '../services/items.js';

export class ExtensionsService extends ItemsService<ExtensionRaw> {
	constructor(options: AbstractServiceOptions) {
		super('directus_extensions', options);
	}
}
