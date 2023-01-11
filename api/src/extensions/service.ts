import { ExtensionRaw } from '@directus/shared/types';
import { AbstractServiceOptions } from '../types/index';
import { ItemsService } from '../services/items';

export class ExtensionsService extends ItemsService<ExtensionRaw> {
	constructor(options: AbstractServiceOptions) {
		super('directus_extensions', options);
	}
}
