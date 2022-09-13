import { AbstractServiceOptions } from '@directus/shared/services';
import { ItemsService } from './items';

export class DashboardsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_dashboards', options);
	}
}
