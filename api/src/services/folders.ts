import { ItemsService } from './items';
import { AbstractServiceOptions } from '../types';

export class FoldersService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_folders', options);
	}
}
