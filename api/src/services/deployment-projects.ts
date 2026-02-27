import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions, PrimaryKey, Project as ProviderProject } from '@directus/types';
import getDatabase from '../database/index.js';
import type { DeploymentDriver } from '../deployment/deployment.js';
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
	 * List provider projects merged with DB selection, syncing names if changed.
	 */
	async listWithSync(deploymentId: string, providerProjects: ProviderProject[]) {
		const selectedProjects = await this.readByQuery({
			filter: { deployment: { _eq: deploymentId } },
			limit: -1,
		});

		const selectedMap = new Map(selectedProjects.map((p) => [p.external_id, p]));

		// Sync names from provider
		const namesToUpdate = selectedProjects
			.map((dbProject) => {
				const providerProject = providerProjects.find((p) => p.id === dbProject.external_id);

				if (providerProject && providerProject.name !== dbProject.name) {
					return { id: dbProject.id, name: providerProject.name };
				}

				return null;
			})
			.filter((update): update is { id: string; name: string } => update !== null);

		if (namesToUpdate.length > 0) {
			await this.updateBatch(namesToUpdate);
		}

		return providerProjects.map((project) => ({
			id: selectedMap.get(project.id)?.id ?? null,
			external_id: project.id,
			name: project.name,
			deployable: project.deployable,
			framework: project.framework,
		}));
	}

	/**
	 * Validate that all projects to create are deployable. Throws if any are not.
	 */
	async validateDeployable(
		driver: DeploymentDriver<any, any>,
		projectsToCreate: { external_id: string; name: string }[],
	): Promise<void> {
		if (projectsToCreate.length === 0) return;

		const providerProjects = await driver.listProjects();
		const projectsMap = new Map(providerProjects.map((p) => [p.id, p]));

		const nonDeployable = projectsToCreate.filter((p) => !projectsMap.get(p.external_id)?.deployable);

		if (nonDeployable.length > 0) {
			const names = nonDeployable.map((p) => projectsMap.get(p.external_id)?.name || p.external_id).join(', ');

			throw new InvalidPayloadError({
				reason: `Cannot add non-deployable projects: ${names}`,
			});
		}
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
				limit: -1,
			});
		});
	}
}
