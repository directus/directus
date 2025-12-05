import type { AbstractServiceOptions, Folder } from '@directus/types';
import { ItemsService } from './items.js';

export class FoldersService extends ItemsService<Folder> {
	constructor(options: AbstractServiceOptions) {
		super('directus_folders', options);
	}
}
