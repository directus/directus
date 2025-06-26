import type { AbstractServiceOptions } from '@directus/types';
import { ItemsService } from './items.js';

export class ActivityService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_activity', options);
	}
}
