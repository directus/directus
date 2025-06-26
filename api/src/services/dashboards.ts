import type { AbstractServiceOptions } from '@directus/types';
import { ItemsService } from './items.js';

export class DashboardsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_dashboards', options);
	}
}
