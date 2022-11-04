import { ItemsService } from './items';
export declare interface FoldersService extends ItemsService {
	collection: string | 'directus_folders'; // little trick to have a FoldersService interface even if it's really just the same has ItemsService one
}
