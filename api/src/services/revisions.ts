import ItemsService from './items';
import { AbstractServiceOptions } from '../types';

/**
 * @TODO only return data / delta based on permissions you have for the requested collection
 */

export default class RevisionsService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_revisions', options);
	}
}
