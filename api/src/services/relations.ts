import ItemsService from './items';
import { AbstractServiceOptions } from '../types';

/**
 * @TODO update foreign key constraints when relations are updated
 */

export default class RelationsService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_relations', options);
	}
}
