import type { AbstractServiceOptions } from '../types/index.js';
import { ItemsService } from './items.js';

export class PoliciesService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_policies', options);
	}
}
