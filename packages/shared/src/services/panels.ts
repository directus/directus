import { ItemsService } from './items';
export declare interface PanelsService extends ItemsService {
	collection: string | 'directus_panels'; // little trick to have a PanelsService interface even if it's really just the same has ItemsService one
}
