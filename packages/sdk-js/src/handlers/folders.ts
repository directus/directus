import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class FoldersHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_folders', axios);
	}
}
