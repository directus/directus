import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class FieldsHandler extends ItemsHandler {
	constructor(axios: AxiosInstance) {
		super('directus_fields', axios);
	}
}
