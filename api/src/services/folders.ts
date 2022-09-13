import { AbstractServiceOptions } from '@directus/shared/services';
import { ItemsService } from './items';

export class FoldersService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_folders', options);
	}
}
