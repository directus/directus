import { AbstractServiceOptions } from '@directus/shared/services';
import { ItemsService } from './items';

export class PanelsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_panels', options);
	}
}
