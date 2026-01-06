import type { AbstractServiceOptions, Item } from '@directus/types';
import { ItemsService } from './items.js';

export interface DeploymentRun extends Item {
	id: string;
	project: string;
	external_id: string;
	target: string;
	date_created: string;
	user_created: string;
}

export class DeploymentRunsService extends ItemsService<DeploymentRun> {
	constructor(options: AbstractServiceOptions) {
		super('directus_deployment_runs', options);
	}
}

