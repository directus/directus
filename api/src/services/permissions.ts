import { AbstractServiceOptions } from '../types';
import { ItemsService } from '../services/items';

export class PermissionsService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_permissions', options);
	}
}
