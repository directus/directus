import { AbstractServiceOptions } from '../types';
import { ItemsService } from './items';

export class SharesService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_shares', options);
	}
}
