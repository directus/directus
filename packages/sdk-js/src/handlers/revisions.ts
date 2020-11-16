import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class RevisionsHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_revisions', axios);
	}
}
