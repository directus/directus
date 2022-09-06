import type { AbstractServiceOptions } from '../types';
import { ItemsService } from './items';

export class DashboardsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_dashboards', options);
	}
}
