import ItemsService from './items';
import { AbstractServiceOptions } from '../types';

/**
 * @TODO only return activity of the collections you have access to
 */

export default class ActivityService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_activity', options);
	}
}
