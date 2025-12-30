import { ItemsService } from './items.js';
import type { AbstractServiceOptions } from '@directus/types';

export class DashboardsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_dashboards', options);
	}
}
