import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class RelationsHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_relations', axios);
	}
}
