import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class CollectionsHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_collections', axios);
	}
}
