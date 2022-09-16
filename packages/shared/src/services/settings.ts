import { ItemsService } from './items';
export declare interface SettingsService extends ItemsService {
	collection: 'directus_settings'; // little trick to have a SettingsService even if it's really just the same has ItemsService one
}
