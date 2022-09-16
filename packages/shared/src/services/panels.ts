import { ItemsService } from './items';
export declare interface PanelsService extends ItemsService {
	collection: 'directus_panels'; // little trick to have a PanelsService even if it's really just the same has ItemsService one
}
