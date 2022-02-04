import { AbstractServiceOptions } from '../types';
import { ItemsService } from './index';

/**
 * @TODO only return activity of the collections you have access to
 */

export class ActivityService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_activity', options);
	}
}
