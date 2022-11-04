import { ItemsService } from './items';
export declare interface SettingsService extends ItemsService {
	collection: string | 'directus_settings'; // little trick to have a SettingsService interface even if it's really just the same has ItemsService one
}
