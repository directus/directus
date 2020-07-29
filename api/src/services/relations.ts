import ItemsService from './items';
import { AbstractServiceOptions } from '../types';

export default class RelationsService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_relations', options);
	}
}
