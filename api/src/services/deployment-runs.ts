import type { AbstractServiceOptions } from '@directus/types';
import { ItemsService } from './items.js';

export interface DeploymentRun {
	id: string;
	project: string;
	external_id: string;
	target: string;
	status: string | null;
	url: string | null;
	started_at: string | null;
	completed_at: string | null;
	date_created: string;
	user_created: string;
}

export class DeploymentRunsService extends ItemsService<DeploymentRun> {
	constructor(options: AbstractServiceOptions) {
		super('directus_deployment_runs', options);
	}
}
