import type { AbstractServiceOptions, Item } from '@directus/types';
import { ItemsService } from './items.js';

export interface DeploymentProject extends Item {
	id: string;
	deployment: string;
	external_id: string;
	name: string;
	date_created: string;
	user_created: string;
}

export class DeploymentProjectsService extends ItemsService<DeploymentProject> {
	constructor(options: AbstractServiceOptions) {
		super('directus_deployment_projects', options);
	}
}
