import { ItemsService } from './items.js';
import type { AbstractServiceOptions } from '@directus/types';

export class ActivityService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_activity', options);
	}
}
