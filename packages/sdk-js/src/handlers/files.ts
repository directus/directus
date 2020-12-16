import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class FilesHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_files', axios);
	}
}
