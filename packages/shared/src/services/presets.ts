import { ItemsService } from './items';
export declare interface PresetsService extends ItemsService {
	collection: string | 'directus_presets'; // little trick to have a PresetsService interface even if it's really just the same has ItemsService one
}
