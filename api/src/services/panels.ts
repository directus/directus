import { ItemsService } from './items.js';
import type { AbstractServiceOptions } from '@directus/types';

export class PanelsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_panels', options);
	}
}
