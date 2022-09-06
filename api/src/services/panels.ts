import type { AbstractServiceOptions } from '../types';
import { ItemsService } from './items';

export class PanelsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_panels', options);
	}
}
