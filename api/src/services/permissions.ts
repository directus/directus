import { AbstractServiceOptions, PermissionsAction } from '../types';
import ItemsService from '../services/items';

export default class PermissionsService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_permissions', options);
	}
}
