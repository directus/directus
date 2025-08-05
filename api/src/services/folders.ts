import type { AbstractServiceOptions } from '@directus/types';
import { ItemsService } from './items.js';

export class FoldersService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_folders', options);
	}
}
