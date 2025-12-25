import type { AbstractServiceOptions, MiniApp } from '@directus/types';
import { ItemsService } from './items.js';

export class MinisService extends ItemsService<MiniApp> {
	constructor(options: AbstractServiceOptions) {
		super('directus_minis', options);
	}
}
