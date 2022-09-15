import type { AbstractServiceOptions } from '../types/index.js';
import { ItemsService } from './items.js';

export class DashboardsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_dashboards', options);
	}
}
