import ItemsService from './items';
import { AbstractServiceOptions } from '../types';

export default class RevisionsService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_revisions', options);
	}
}
