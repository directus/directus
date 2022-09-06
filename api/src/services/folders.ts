import type { AbstractServiceOptions } from '../types';
import { ItemsService } from './items';

export class FoldersService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_folders', options);
	}
}
