import ItemsService from './items';
import { AbstractServiceOptions } from '../types';

export default class RolesService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_roles', options);
	}
}
