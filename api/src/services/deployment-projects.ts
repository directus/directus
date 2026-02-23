import type { AbstractServiceOptions, PrimaryKey } from '@directus/types';
import getDatabase from '../database/index.js';
import { transaction } from '../utils/transaction.js';
import { ItemsService } from './items.js';

export interface DeploymentProject {
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

	/**
	 * Find a project by its provider-side external ID. Returns null if not tracked.
	 */
	async readByExternalId(externalId: string): Promise<DeploymentProject | null> {
		const results = await this.readByQuery({
			filter: { external_id: { _eq: externalId } },
			limit: 1,
		});

		return results?.[0] ?? null;
	}

	/**
	 * Update project selection (create/delete)
	 */
	async updateSelection(
		deploymentId: string,
		create: { external_id: string; name: string }[],
		deleteIds: PrimaryKey[],
	): Promise<DeploymentProject[]> {
		const db = getDatabase();

		return transaction(db, async (trx) => {
			const trxService = new DeploymentProjectsService({
				accountability: this.accountability,
				schema: this.schema,
				knex: trx,
			});

			if (deleteIds.length > 0) {
				await trxService.deleteMany(deleteIds);
			}

			if (create.length > 0) {
				await trxService.createMany(
					create.map((p) => ({
						deployment: deploymentId,
						external_id: p.external_id,
						name: p.name,
					})),
				);
			}

			return trxService.readByQuery({
				filter: { deployment: { _eq: deploymentId } },
			});
		});
	}
}
