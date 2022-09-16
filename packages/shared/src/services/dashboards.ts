import { ItemsService } from './items';
export declare interface DashboardsService extends ItemsService {
	collection: 'directus_dashboards'; // little trick to have a DashboardsService even if it's really just the same has ItemsService one
}
