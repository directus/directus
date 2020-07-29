import ItemsService from './items';
import { AbstractServiceOptions } from '../types';

export default class ActivityService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_activity', options);
	}
}
